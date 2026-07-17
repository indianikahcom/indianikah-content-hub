const prisma = require("../database/prisma");

const defaults = { BOOK: 90, GUIDELINE: 60, BLOG: 180 };

function cooldown(type) {
  const value = Number.parseInt(process.env[`${type}_REPUBLISH_AFTER_DAYS`], 10);
  return Number.isInteger(value) && value >= 0 ? value : (defaults[type] || 90);
}

function latest(values) {
  const dates = values.filter(Boolean).map(v => new Date(v))
    .filter(d => !Number.isNaN(d.getTime()));
  return dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
}

async function findRandomUnpublished({ type, platform = "TELEGRAM" }) {
  const normalizedType = String(type || "").trim().toUpperCase();
  const normalizedPlatform = String(platform || "TELEGRAM").trim().toUpperCase();

  const sources = await prisma.contentSource.findMany({
    where: { type: normalizedType, status: { in: ["NEW", "PROCESSED"] } },
    include: {
      post: {
        include: {
          publications: true,
          campaigns: { include: { publications: true } }
        }
      }
    }
  });

  const days = cooldown(normalizedType);
  const cutoffMs = days * 86400000;
  const now = Date.now();

  const eligible = sources.map(source => {
    if (!source.post) return { source, never: true, last: null };

    if ((source.post.campaigns || []).some(c => ["PENDING", "RUNNING"].includes(c.status))) {
      return null;
    }

    const legacy = (source.post.publications || [])
      .filter(p => p.platform === normalizedPlatform && p.status === "SUCCESS")
      .map(p => p.publishedAt);

    const modern = (source.post.campaigns || []).flatMap(c =>
      (c.publications || [])
        .filter(p => p.platform === normalizedPlatform && p.status === "SUCCESS")
        .map(p => p.publishedAt)
    );

    const last = latest([...legacy, ...modern]);
    if (!last) return { source, never: true, last: null };
    if (now - last.getTime() < cutoffMs) return null;
    return { source, never: false, last };
  }).filter(Boolean);

  if (!eligible.length) return null;

  const fresh = eligible.filter(x => x.never);
  const pool = fresh.length
    ? fresh
    : eligible.sort((a, b) => a.last.getTime() - b.last.getTime()).slice(0, 10);

  const picked = pool[Math.floor(Math.random() * pool.length)];

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

module.exports = { findRandomUnpublished };
