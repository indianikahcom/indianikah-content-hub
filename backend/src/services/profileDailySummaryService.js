const prisma = require("../database/prisma");
const AppError = require("../errors/AppError");
const productionProfileRepository = require("../repositories/productionProfileRepository");
const { buildProfileSummaryStats } = require("./profileSummaryStatsService");
const { buildSummaryPost, platformVariants } = require("./profileSummaryTemplateService");

function intValue(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function indiaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function parseMetadata(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return {}; }
}

async function collect(options = {}) {
  const hours = intValue(options.hours, 24, 168);
  const topLimit = intValue(options.topLimit, 5, 10);
  const fetchLimit = intValue(options.fetchLimit, 5000, 5000);

  const profiles = await productionProfileRepository.findRecentPublicProfiles(hours, fetchLimit);
  const endedAt = new Date();
  const startedAt = new Date(endedAt.getTime() - hours * 3600000);
  const statistics = buildProfileSummaryStats(profiles, { topLimit });
  const generated = buildSummaryPost(statistics, { hours, startedAt, endedAt });

  return { hours, topLimit, fetchLimit, startedAt, endedAt, statistics, generated };
}

async function preview(options = {}) {
  return {
    ...(await collect(options)),
    privacy: {
      version: "PROFILE_SUMMARY_SAFE_V2",
      containsIndividualProfiles: false,
      exposesPersonalContactDetails: false
    }
  };
}

async function createDailySummary(options = {}) {
  const collected = await collect(options);
  const dryRun = Boolean(options.dryRun);
  const replaceExisting = Boolean(options.replaceExisting);
  const variants = options.composePlatforms === false ? [] : platformVariants(collected.generated);
  const externalId = `profile-daily-summary:${indiaDateKey(collected.endedAt)}`;

  if (dryRun) {
    return {
      dryRun: true, externalId, ...collected, variants,
      privacy: {
        version: "PROFILE_SUMMARY_SAFE_V2",
        containsIndividualProfiles: false,
        exposesPersonalContactDetails: false
      }
    };
  }

  const existing = await prisma.contentSource.findUnique({
    where: { externalId },
    include: { posts: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  if (existing && !replaceExisting) {
    throw new AppError(
      `Daily profile summary already exists for ${indiaDateKey(collected.endedAt)}. Use replaceExisting=true.`,
      409
    );
  }

  const metadata = {
    privacyVersion: "PROFILE_SUMMARY_SAFE_V2",
    sourceRepository: "productionProfileRepository",
    sourceMethod: "findRecentPublicProfiles",
    aggregation: "LAST_N_HOURS",
    hours: collected.hours,
    startedAt: collected.startedAt.toISOString(),
    endedAt: collected.endedAt.toISOString(),
    statistics: collected.statistics,
    containsIndividualProfiles: false
  };

  const created = await prisma.$transaction(async (tx) => {
    let source;

    if (existing) {
      if (existing.posts?.[0]) {
        await tx.postVariant.deleteMany({ where: { postId: existing.posts?.[0].id } });
        await tx.post.delete({ where: { id: existing.posts?.[0].id } });
      }
      source = await tx.contentSource.update({
        where: { id: existing.id },
        data: {
          type: "PROFILE_DAILY_SUMMARY",
          title: collected.generated.title,
          sourceUrl: "https://www.indianikah.com",
          rawContent: JSON.stringify({ period: metadata, statistics: collected.statistics }),
          metadata: JSON.stringify(metadata),
          status: "PROCESSED",
          updatedAt: new Date()
        }
      });
    } else {
      source = await tx.contentSource.create({
        data: {
          type: "PROFILE_DAILY_SUMMARY",
          title: collected.generated.title,
          sourceUrl: "https://www.indianikah.com",
          externalId,
          rawContent: JSON.stringify({ period: metadata, statistics: collected.statistics }),
          metadata: JSON.stringify(metadata),
          status: "PROCESSED"
        }
      });
    }

    const post = await tx.post.create({
      data: {
        title: collected.generated.title,
        content: collected.generated.content,
        status: "DRAFT",
        sourceId: source.id
      }
    });

    for (const variant of variants) {
      await tx.postVariant.create({
        data: {
          postId: post.id,
          platform: variant.platform,
          title: variant.title,
          content: variant.content,
          status: "DRAFT",
          updatedAt: new Date()
        }
      });
    }

    return tx.post.findUnique({
      where: { id: post.id },
      include: { source: true, variants: { orderBy: { platform: "asc" } } }
    });
  });

  if (created?.source) created.source.metadata = parseMetadata(created.source.metadata);

  return {
    dryRun: false,
    externalId,
    hours: collected.hours,
    statistics: collected.statistics,
    variantCount: variants.length,
    post: created,
    approvalReady: {
      mode: process.env.CONTENT_AUTOMATION_MODE || "MANUAL_APPROVAL",
      currentStatus: "DRAFT"
    }
  };
}

module.exports = { preview, createDailySummary };
