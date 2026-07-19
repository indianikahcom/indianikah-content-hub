const prisma = require("../database/prisma");

const defaults = {
  BOOK: 90,
  GUIDELINE: 60,
  BLOG: 180
};

function cooldown(type) {
  const value = Number.parseInt(
      process.env[`${type}_REPUBLISH_AFTER_DAYS`],
      10
  );

  return Number.isInteger(value) && value >= 0
      ? value
      : (defaults[type] || 90);
}

function latest(values) {
  const dates = values
      .filter(Boolean)
      .map(value => new Date(value))
      .filter(date => !Number.isNaN(date.getTime()));

  return dates.length
      ? new Date(
          Math.max(...dates.map(date => date.getTime()))
      )
      : null;
}

function normalizeSource(source) {
  const posts = source.posts || [];

  return {
    ...source,
    posts,
    post: posts.length ? posts[0] : null
  };
}

async function findRandomUnpublished({
                                       type,
                                       platform = "TELEGRAM"
                                     }) {
  const normalizedType = String(type || "")
      .trim()
      .toUpperCase();

  const normalizedPlatform = String(
      platform || "TELEGRAM"
  )
      .trim()
      .toUpperCase();

  const sources = await prisma.contentSource.findMany({
    where: {
      type: normalizedType,
      status: {
        in: ["NEW", "PROCESSED"]
      }
    },
    include: {
      posts: {
        include: {
          publications: true,
          campaigns: {
            include: {
              publications: true
            }
          }
        }
      }
    }
  });

  const normalizedSources = sources.map(normalizeSource);

  const days = cooldown(normalizedType);
  const cutoffMs = days * 86400000;
  const now = Date.now();

  const eligible = normalizedSources
      .map(source => {
        const post = source.post;

        if (!post) {
          return {
            source,
            never: true,
            last: null
          };
        }

        const hasActiveCampaign = (
            post.campaigns || []
        ).some(campaign =>
            ["PENDING", "RUNNING"].includes(
                campaign.status
            )
        );

        if (hasActiveCampaign) {
          return null;
        }

        const legacy = (
            post.publications || []
        )
            .filter(publication =>
                publication.platform ===
                normalizedPlatform &&
                publication.status === "SUCCESS"
            )
            .map(publication =>
                publication.publishedAt
            );

        const modern = (
            post.campaigns || []
        ).flatMap(campaign =>
            (campaign.publications || [])
                .filter(publication =>
                    publication.platform ===
                    normalizedPlatform &&
                    publication.status === "SUCCESS"
                )
                .map(publication =>
                    publication.publishedAt
                )
        );

        const last = latest([
          ...legacy,
          ...modern
        ]);

        if (!last) {
          return {
            source,
            never: true,
            last: null
          };
        }

        if (
            now - last.getTime() <
            cutoffMs
        ) {
          return null;
        }

        return {
          source,
          never: false,
          last
        };
      })
      .filter(Boolean);

  if (!eligible.length) {
    return null;
  }

  const fresh = eligible.filter(
      item => item.never
  );

  const pool = fresh.length
      ? fresh
      : [...eligible]
          .sort(
              (a, b) =>
                  a.last.getTime() -
                  b.last.getTime()
          )
          .slice(0, 10);

  const picked =
      pool[
          Math.floor(
              Math.random() * pool.length
          )
          ];

  return {
    ...picked.source,
    selectionInfo: {
      neverPublished: picked.never,
      lastPublishedAt: picked.last,
      cooldownDays: days,
      platform: normalizedPlatform
    }
  };
}

module.exports = {
  findRandomUnpublished
};