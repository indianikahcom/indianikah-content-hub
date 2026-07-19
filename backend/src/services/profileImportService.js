const productionProfileRepository = require("../repositories/productionProfileRepository");
const sourceRepository = require("../repositories/sourceRepository");
const importRepository = require("../repositories/importRepository");
const queueRepository = require("../repositories/queueRepository");
const sourceService = require("./sourceService");
const { buildProfileSummaryStats } = require("./profileSummaryStatsService");
const { buildSummaryPost } = require("./profileSummaryTemplateService");
const prisma = require("../database/prisma");
const AppError = require("../errors/AppError");
const {
    testProductionConnection,
} = require("../database/productionMysql");

const INVALID_VALUES = new Set([
    "",
    "-",
    "--",
    ".",
    "0",
    "no",
    "none",
    "na",
    "n/a",
    "nil",
    "null",
    "unknown",
    "not applicable",
    "not mentioned",
    "not specified",
    "nothing",
    "dont know",
    "don't know",
]);

const INVALID_OCCUPATIONS = new Set([
    ...INVALID_VALUES,
    "not working",
    "assalamualaikum",
    "assalamu alaikum",
    "salam",
    "kya likhu",
]);

function clean(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const text = String(value)
        .replace(/\s+/g, " ")
        .trim();

    return text || null;
}

function normalizedText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function titleCase(value) {
    const text = clean(value);

    if (!text) {
        return null;
    }

    return text
        .split(" ")
        .map((word) => {
            if (!word) return word;

            // Keep abbreviations such as MBA, B.Tech and IT readable.
            if (
                word === word.toUpperCase() &&
                /[A-Z]/.test(word)
            ) {
                return word;
            }

            return (
                word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase()
            );
        })
        .join(" ");
}

function validGeneralValue(value) {
    const text = clean(value);

    if (!text) {
        return null;
    }

    const normalized = normalizedText(text);

    if (INVALID_VALUES.has(normalized)) {
        return null;
    }

    if (normalized.length > 100) {
        return null;
    }

    return text;
}

function validOccupation(value) {
    const occupation = validGeneralValue(value);

    if (!occupation) {
        return null;
    }

    const normalized = normalizedText(occupation);

    if (INVALID_OCCUPATIONS.has(normalized)) {
        return null;
    }

    if (normalized.length < 2 || normalized.length > 80) {
        return null;
    }

    if (/^[\d\s.,/_-]+$/.test(normalized)) {
        return null;
    }

    return titleCase(occupation);
}

function normalizedGender(value) {
    const normalized = normalizedText(value);

    if (["male", "m", "man", "boy"].includes(normalized)) {
        return "Male";
    }

    if (
        ["female", "f", "woman", "girl"].includes(normalized)
    ) {
        return "Female";
    }

    return null;
}

function normalizedMaritalStatus(value) {
    const normalized = normalizedText(value);

    if (!normalized || INVALID_VALUES.has(normalized)) {
        return null;
    }

    if (
        [
            "never married",
            "unmarried",
            "single",
            "never-married",
        ].includes(normalized)
    ) {
        return "Never Married";
    }

    if (
        ["divorced", "divorcee", "divorce"].includes(normalized)
    ) {
        return "Divorced";
    }

    if (
        ["widow", "widowed", "widower"].includes(normalized)
    ) {
        return "Widowed";
    }

    if (
        ["separated", "legally separated"].includes(normalized)
    ) {
        return "Separated";
    }

    if (
        ["married", "currently married"].includes(normalized)
    ) {
        return "Married";
    }

    return titleCase(value);
}

function normalizedEducation(profile) {
    const value =
        validGeneralValue(profile.degree) ||
        validGeneralValue(profile.education);

    return value ? titleCase(value) : null;
}

function normalizedState(profile) {
    const value =
        validGeneralValue(profile.state_current) ||
        validGeneralValue(profile.state);

    return value ? titleCase(value) : null;
}

function profileLocation(profile) {
    return (
        clean(profile.city_current) ||
        clean(profile.city) ||
        clean(profile.state_current) ||
        clean(profile.state) ||
        clean(profile.country_current) ||
        clean(profile.country)
    );
}

function safeProfileMetadata(profile) {
    return {
        profileId: profile.id,
        profileCode: String(profile.profile_code),
        slug: clean(profile.slug),
        age: profile.age,
        gender: normalizedGender(profile.gender),
        height: clean(profile.height),
        maritalStatus: normalizedMaritalStatus(
            profile.martial_status
        ),
        education: clean(profile.education),
        degree: clean(profile.degree),
        occupation: validOccupation(profile.occupation),
        city: clean(profile.city),
        state: clean(profile.state),
        country: clean(profile.country),
        currentCity: clean(profile.city_current),
        currentState: clean(profile.state_current),
        currentCountry: clean(profile.country_current),
        createdOn: profile.created_on,
    };
}

function safeProfileContent(profile) {
    const fields = [
        ["Age", profile.age],
        ["Gender", normalizedGender(profile.gender)],
        [
            "Marital status",
            normalizedMaritalStatus(profile.martial_status),
        ],
        ["Education", normalizedEducation(profile)],
        ["Occupation", validOccupation(profile.occupation)],
        ["Location", profileLocation(profile)],
    ];

    return fields
        .filter(([, value]) => clean(value))
        .map(([label, value]) => `${label}: ${clean(value)}`)
        .join("\n");
}

function dateKey() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function summaryProfile(profile) {
    return {
        ...profile,
        gender: normalizedGender(profile.gender),
        martial_status: normalizedMaritalStatus(
            profile.martial_status ||
            profile.marital_status ||
            profile.maritalStatus
        ),
        education: normalizedEducation(profile),
        degree: normalizedEducation(profile),
        occupation: validOccupation(
            profile.occupation || profile.profession
        ),
        city_current: titleCase(
            validGeneralValue(
                profile.city_current ||
                profile.city ||
                profile.current_city
            )
        ),
        state_current: titleCase(
            validGeneralValue(
                profile.state_current ||
                profile.state ||
                profile.current_state
            )
        ),
        country_current: titleCase(
            validGeneralValue(
                profile.country_current ||
                profile.country ||
                profile.current_country
            )
        ),
    };
}

function buildDailySummary(profiles, options = {}) {
    const hours = Number.parseInt(options.hours, 10) || 24;
    const topLimit = Number.parseInt(options.topLimit, 10) || 5;
    const normalizedProfiles = profiles.map(summaryProfile);
    const statistics = buildProfileSummaryStats(normalizedProfiles, {
        topLimit,
    });

    return buildSummaryPost(statistics, { hours });
}

async function createSummaryDraft(profiles, options = {}) {
    if (!profiles.length) {
        return null;
    }

    const summary = buildDailySummary(profiles, options);
    const externalId = `daily-profile-summary:${dateKey()}`;

    const existing =
        await sourceRepository.findByExternalId(externalId);

    if (existing) {
        // Preserve history by creating a fresh local draft for each summary run.
        // The production database remains strictly read-only.
        return sourceService.generateDraftPost(existing.id, summary);
    }

    const source = await sourceService.createSource({
        type: "PROFILE_SUMMARY",
        title: summary.title,
        externalId,
        rawContent: summary.content,
        metadata: {
            anonymized: true,
            profileCount: profiles.length,
            summaryDate: dateKey(),
            source: "django.Profiles",
            statisticsFormat: "PROFILE_SUMMARY_SAFE_V2",
        },
    });

    return sourceService.generateDraftPost(source.id, summary);
}

async function ensureSummaryQueued(summaryPost, hours) {
    if (!summaryPost?.id) {
        return null;
    }

    const existingQueueItem =
        await queueRepository.findLatestByPostId(summaryPost.id);

    if (existingQueueItem) {
        return existingQueueItem;
    }

    return queueRepository.create({
        postId: summaryPost.id,
        contentType: "PROFILE_SUMMARY",
        platform: "ALL",
        status:
            summaryPost.status === "APPROVED"
                ? "APPROVED"
                : "READY",
        priority: 50,
        metadata: JSON.stringify({
            source: "PROFILE_IMPORT",
            hours,
            generatedAutomatically: true,
            summaryDate: dateKey(),
            statisticsFormat: "PROFILE_SUMMARY_SAFE_V2",
        }),
    });
}

let activeImportPromise = null;

function parseMetadata(value) {
    if (!value) return {};
    if (typeof value === "object") return value;
    try { return JSON.parse(value); } catch { return {}; }
}

function sourceRecord(profile) {
    const metadata = safeProfileMetadata(profile);
    metadata.verificationStatus = clean(profile.verification_status);
    metadata.updatedOn = profile.updated;
    metadata.privacyVersion = "PROFILE_SAFE_V1";
    metadata.source = "django.Profiles";

    return {
        type: "PROFILE",
        title: `IndiaNikah profile ${profile.profile_code}`,
        sourceUrl: profile.slug ? `https://indianikah.com/profile/${profile.slug}` : null,
        externalId: `profile:${profile.profile_code}`,
        rawContent: safeProfileContent(profile) || null,
        metadata: JSON.stringify(metadata),
        status: "NEW",
    };
}

async function resolveCursor(requestedCursor) {
    if (requestedCursor !== undefined && requestedCursor !== null) return Number(requestedCursor);
    const previous = await importRepository.findLatestSuccessfulRun("PRODUCTION_PROFILES_CURSOR");
    return Number(parseMetadata(previous?.metadata).lastProcessedId || 0);
}

async function runCursorImport({
    batchSize = 250,
    maxBatches = 20,
    startAfterId,
    dryRun = false,
    generateSummary = false,
} = {}) {
    const running = await importRepository.findRunningRun("PRODUCTION_PROFILES_CURSOR");
    if (running) throw new AppError(`Profile import run ${running.id} is already running`, 409);

    const initialCursor = await resolveCursor(startAfterId);
    const run = await importRepository.createRun({
        importType: "PRODUCTION_PROFILES_CURSOR",
        status: "RUNNING",
        metadata: JSON.stringify({
            mode: "CURSOR",
            initialCursor,
            lastProcessedId: initialCursor,
            batchSize,
            maxBatches,
            dryRun,
            generateSummary,
            privacyVersion: "PROFILE_SAFE_V1",
        }),
    });

    let cursor = initialCursor;
    let fetchedCount = 0;
    let importedCount = 0;
    let skippedCount = 0;
    let batchesProcessed = 0;
    const summaryProfiles = [];

    try {
        for (let batchNumber = 1; batchNumber <= maxBatches; batchNumber += 1) {
            const profiles = await productionProfileRepository.findProfileBatchAfterId({ afterId: cursor, limit: batchSize });
            if (!profiles.length) break;

            batchesProcessed += 1;
            fetchedCount += profiles.length;
            cursor = Number(profiles[profiles.length - 1].id);
            if (generateSummary) summaryProfiles.push(...profiles);

            const records = profiles.map(sourceRecord);
            const externalIds = records.map((record) => record.externalId);
            const existing = await sourceRepository.findExistingExternalIds(externalIds);
            const newRecords = records.filter((record) => !existing.has(record.externalId));
            skippedCount += records.length - newRecords.length;

            if (!dryRun && newRecords.length) {
                const result = await sourceRepository.createMany(newRecords);
                importedCount += result.count;
                skippedCount += newRecords.length - result.count;
            } else if (dryRun) {
                importedCount += newRecords.length;
            }

            await importRepository.updateRun(run.id, {
                fetchedCount,
                importedCount,
                skippedCount,
                metadata: JSON.stringify({
                    mode: "CURSOR",
                    initialCursor,
                    lastProcessedId: cursor,
                    batchSize,
                    maxBatches,
                    batchesProcessed,
                    dryRun,
                    generateSummary,
                    privacyVersion: "PROFILE_SAFE_V1",
                }),
            });

            if (profiles.length < batchSize) break;
        }

        let summaryPost = null;
        let queueItem = null;
        if (!dryRun && generateSummary && summaryProfiles.length) {
            const summary = await createSummaryDraft(summaryProfiles, { hours: 24 });
            summaryPost = summary?.post || null;
            queueItem = summaryPost ? await ensureSummaryQueued(summaryPost, null) : null;
        }

        const completed = await importRepository.completeRun(run.id, {
            status: "COMPLETED",
            fetchedCount,
            importedCount,
            skippedCount,
            summaryPostId: summaryPost?.id || null,
            metadata: JSON.stringify({
                mode: "CURSOR",
                initialCursor,
                lastProcessedId: cursor,
                batchSize,
                maxBatches,
                batchesProcessed,
                dryRun,
                generateSummary,
                hasMoreLikely: batchesProcessed === maxBatches,
                privacyVersion: "PROFILE_SAFE_V1",
            }),
        });

        return { run: completed, cursor: { startedAfterId: initialCursor, lastProcessedId: cursor }, summaryPost, queueItem };
    } catch (error) {
        await importRepository.completeRun(run.id, {
            status: "FAILED",
            fetchedCount,
            importedCount,
            skippedCount,
            errorMessage: error.message,
            metadata: JSON.stringify({ mode: "CURSOR", initialCursor, lastProcessedId: cursor, batchSize, maxBatches, batchesProcessed, dryRun }),
        });
        throw error;
    }
}

async function runRecentImport({ hours = 24, limit = 1000, generateSummary = true, dryRun = false } = {}) {
    const run = await importRepository.createRun({
        importType: "PRODUCTION_PROFILES_RECENT",
        status: "RUNNING",
        metadata: JSON.stringify({ mode: "RECENT", hours, limit, generateSummary, dryRun }),
    });

    try {
        const profiles = await productionProfileRepository.findRecentPublicProfiles(hours, limit);
        const records = profiles.map(sourceRecord);
        const existing = await sourceRepository.findExistingExternalIds(records.map((record) => record.externalId));
        const newRecords = records.filter((record) => !existing.has(record.externalId));
        let importedCount = newRecords.length;
        if (!dryRun && newRecords.length) importedCount = (await sourceRepository.createMany(newRecords)).count;
        const skippedCount = records.length - importedCount;

        const summary = !dryRun && generateSummary ? await createSummaryDraft(profiles, { hours }) : null;
        const summaryPost = summary?.post || null;
        const queueItem = summaryPost ? await ensureSummaryQueued(summaryPost, hours) : null;
        const completed = await importRepository.completeRun(run.id, {
            status: "COMPLETED", fetchedCount: profiles.length, importedCount, skippedCount,
            summaryPostId: summaryPost?.id || null,
            metadata: JSON.stringify({ mode: "RECENT", hours, limit, generateSummary, dryRun, privacyVersion: "PROFILE_SAFE_V1" }),
        });
        return { run: completed, summaryPost, queueItem };
    } catch (error) {
        await importRepository.completeRun(run.id, { status: "FAILED", errorMessage: error.message });
        throw error;
    }
}

async function importProfiles(options = {}) {
    if (activeImportPromise) throw new AppError("A profile import is already executing in this process", 409);
    const task = options.mode === "RECENT" ? runRecentImport(options) : runCursorImport(options);
    activeImportPromise = task;
    try { return await task; } finally { activeImportPromise = null; }
}

async function importRecentProfiles(options = {}) {
    return importProfiles({ ...options, mode: "RECENT" });
}

async function getImportRuns(limit = 20) {
    const runs = await importRepository.listRuns(limit);
    return runs.map((run) => ({ ...run, metadata: parseMetadata(run.metadata) }));
}

async function getImportStatus() {
    const [overview, production] = await Promise.all([
        importRepository.getImportOverview(),
        productionProfileRepository.getPublicProfileStats(),
    ]);
    return {
        ...overview,
        latest: overview.latest ? { ...overview.latest, metadata: parseMetadata(overview.latest.metadata) } : null,
        running: overview.running.map((run) => ({ ...run, metadata: parseMetadata(run.metadata) })),
        production,
        processLockActive: Boolean(activeImportPromise),
    };
}

async function testConnection() {
    const connection = await testProductionConnection();
    return { ...connection, verifiedReadOnlyAccount: String(connection.currentUser || "").startsWith("contenthub_reader@") };
}

module.exports = {
    importProfiles,
    importRecentProfiles,
    getImportRuns,
    getImportStatus,
    testConnection,
    buildDailySummary,
};

