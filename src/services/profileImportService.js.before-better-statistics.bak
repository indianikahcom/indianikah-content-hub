const productionProfileRepository = require("../repositories/productionProfileRepository");
const sourceRepository = require("../repositories/sourceRepository");
const importRepository = require("../repositories/importRepository");
const queueRepository = require("../repositories/queueRepository");
const sourceService = require("./sourceService");
const prisma = require("../database/prisma");
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

function countBy(rows, getter, max = 8) {
    const counts = new Map();

    for (const row of rows) {
        const value = clean(getter(row));

        if (!value) {
            continue;
        }

        counts.set(value, (counts.get(value) || 0) + 1);
    }

    return [...counts.entries()]
        .sort((a, b) => {
            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }

            return a[0].localeCompare(b[0]);
        })
        .slice(0, max);
}

function percentage(count, total) {
    if (!total) {
        return "0%";
    }

    const value = (count / total) * 100;

    return Number.isInteger(value)
        ? `${value}%`
        : `${value.toFixed(1)}%`;
}

function formatSection(title, icon, items, total) {
    if (!items.length) {
        return null;
    }

    const lines = items.map(
        ([label, count]) =>
            `• ${label} — ${count} (${percentage(count, total)})`
    );

    return `${icon} ${title}\n${lines.join("\n")}`;
}

function dateKey() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function buildDailySummary(profiles) {
    const total = profiles.length;

    const genders = countBy(
        profiles,
        (profile) => normalizedGender(profile.gender),
        2
    );

    const states = countBy(
        profiles,
        normalizedState,
        8
    );

    const occupations = countBy(
        profiles,
        (profile) => validOccupation(profile.occupation),
        8
    );

    const maritalStatuses = countBy(
        profiles,
        (profile) =>
            normalizedMaritalStatus(profile.martial_status),
        8
    );

    const education = countBy(
        profiles,
        normalizedEducation,
        8
    );

    const sections = [
        `📊 IndiaNikah — Last 24 Hours\n\n${total} new profiles registered.`,
        formatSection(
            "Male / Female",
            "👥",
            genders,
            total
        ),
        formatSection(
            "State-wise",
            "📍",
            states,
            total
        ),
        formatSection(
            "Occupation-wise",
            "💼",
            occupations,
            total
        ),
        formatSection(
            "Marital-status-wise",
            "💍",
            maritalStatuses,
            total
        ),
        formatSection(
            "Education-wise",
            "🎓",
            education,
            total
        ),
        "Browse profiles on IndiaNikah:\nhttps://www.indianikah.com",
        `Need help or want to contact IndiaNikah?

WhatsApp:
http://wa.me/918482833177

Email:
contact@indianikah.com

IndiaNikah - 100% free forever.`,
    ].filter(Boolean);

    return {
        title: `${total} new profiles on IndiaNikah`,
        content: sections.join("\n\n"),
    };
}

async function refreshExistingSummary(existing, summary) {
    const post = existing.post;

    await prisma.$transaction([
        prisma.contentSource.update({
            where: { id: existing.id },
            data: {
                title: summary.title,
                rawContent: summary.content,
                metadata: JSON.stringify({
                    anonymized: true,
                    profileCount:
                        Number(
                            summary.title.match(/^\d+/)?.[0]
                        ) || null,
                    summaryDate: dateKey(),
                    source: "django.Profiles",
                    statisticsFormat: "ENHANCED_V1",
                }),
            },
        }),
        prisma.post.update({
            where: { id: post.id },
            data: {
                title: summary.title,
                content: summary.content,
            },
        }),
    ]);

    return prisma.post.findUnique({
        where: { id: post.id },
    });
}

async function createSummaryDraft(profiles) {
    if (!profiles.length) {
        return null;
    }

    const summary = buildDailySummary(profiles);
    const externalId = `daily-profile-summary:${dateKey()}`;

    const existing =
        await sourceRepository.findByExternalId(externalId);

    if (existing?.post) {
        // Refresh only local Content Hub data. Production profiles are
        // never updated or deleted.
        const refreshedPost =
            await refreshExistingSummary(existing, summary);

        return {
            post: refreshedPost,
            source: existing,
            existing: true,
            refreshed: true,
        };
    }

    if (existing) {
        return sourceService.generateDraftPost(
            existing.id,
            summary
        );
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
            statisticsFormat: "ENHANCED_V1",
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
            statisticsFormat: "ENHANCED_V1",
        }),
    });
}

async function importRecentProfiles({
    hours = 24,
    generateSummary = true,
} = {}) {
    const run = await importRepository.createRun({
        importType: "PRODUCTION_PROFILES",
        status: "RUNNING",
        metadata: JSON.stringify({
            hours,
            generateSummary,
        }),
    });

    try {
        const profiles =
            await productionProfileRepository.findRecentPublicProfiles(
                hours
            );

        let importedCount = 0;
        let skippedCount = 0;

        for (const profile of profiles) {
            const externalId = `profile:${profile.profile_code}`;

            if (
                await sourceRepository.findByExternalId(
                    externalId
                )
            ) {
                skippedCount += 1;
                continue;
            }

            await sourceService.createSource({
                type: "PROFILE",
                title: `IndiaNikah profile ${profile.profile_code}`,
                sourceUrl: profile.slug
                    ? `https://indianikah.com/profile/${profile.slug}`
                    : null,
                externalId,
                rawContent: safeProfileContent(profile),
                metadata: safeProfileMetadata(profile),
            });

            importedCount += 1;
        }

        const summary = generateSummary
            ? await createSummaryDraft(profiles)
            : null;

        const summaryPost = summary?.post || null;
        const summaryPostId = summaryPost?.id || null;

        const queueItem = summaryPost
            ? await ensureSummaryQueued(summaryPost, hours)
            : null;

        const completed = await importRepository.completeRun(
            run.id,
            {
                status: "COMPLETED",
                fetchedCount: profiles.length,
                importedCount,
                skippedCount,
                summaryPostId,
            }
        );

        return {
            run: completed,
            summaryPost,
            queueItem: queueItem
                ? {
                      id: queueItem.id,
                      postId: queueItem.postId,
                      contentType: queueItem.contentType,
                      status: queueItem.status,
                      priority: queueItem.priority,
                  }
                : null,
        };
    } catch (error) {
        await importRepository.completeRun(run.id, {
            status: "FAILED",
            errorMessage: error.message,
        });

        throw error;
    }
}

async function getImportRuns(limit = 20) {
    return importRepository.listRuns(limit);
}

async function testConnection() {
    return testProductionConnection();
}

module.exports = {
    importRecentProfiles,
    getImportRuns,
    testConnection,
};
