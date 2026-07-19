function section(title, items, limit = 5) {
  const rows = (items || [])
      .filter((x) => x.label !== "Not specified")
      .slice(0, limit)
      .map((x) => `â€¢ ${x.label} â€” ${x.count}`);

  return rows.length ? `${title}\n${rows.join("\n")}` : null;
}

function buildSummaryPost(stats, window = {}) {
  const total = stats.totalProfiles || 0;
  const hours = window.hours || 24;

  if (!total) {
    return {
      title: `No new public profiles in the last ${hours} hours`,
      content:
          `No new public matrimonial profiles were added during the last ${hours} hours.\n\n` +
          `Explore existing profiles:\n` +
          `https://www.indianikah.com\n\n` +
          `IndiaNikah â€” 100% free forever.`,
    };
  }

  const title =
      `${total} new matrimonial profile${total === 1 ? "" : "s"} ` +
      `in the last ${hours} hours`;

  const h = stats.highlights || {};

  return {
    title,
    content: [
      `âœ¨ ${title}`,
      section("ðŸ‘¥ Gender", h.genders, 3),
      section("ðŸŽ‚ Age Groups", h.ageGroups, 6),
      section("ðŸ“ Top Cities", h.cities),
      section("ðŸ—ºï¸ Top States", h.states),
      section("ðŸ’¼ Occupations", h.occupations),
      section("ðŸŽ“ Education", h.education),
      section("ðŸ’ Marital Status", h.maritalStatuses),
      stats.verifiedProfiles
          ? `âœ… Verified profiles: ${stats.verifiedProfiles}`
          : null,
      "Browse the latest profiles:\nhttps://www.indianikah.com",
      "Anonymous statistics only. No individual profile details are shared.",
      "IndiaNikah â€” 100% free forever.",
    ]
        .filter(Boolean)
        .join("\n\n"),
  };
}

function platformVariants(post) {
  const x = `${post.title}\n\nhttps://www.indianikah.com\n\n#IndiaNikah`;

  return [
    {
      platform: "FACEBOOK",
      title: post.title,
      content: `${post.content}\n\n#IndiaNikah #Matrimony`,
    },
    {
      platform: "INSTAGRAM",
      title: null,
      content: `${post.content}\n\n#IndiaNikah #MuslimMatrimony #FreeMatrimony`,
    },
    {
      platform: "X",
      title: null,
      content: x.length <= 280 ? x : `${x.slice(0, 277)}...`,
    },
    {
      platform: "LINKEDIN",
      title: post.title,
      content: `${post.content}\n\n#IndiaNikah #Matrimony`,
    },
    {
      platform: "TELEGRAM",
      title: post.title,
      content: post.content,
    },
    {
      platform: "WHATSAPP",
      title: null,
      content: post.content,
    },
  ];
}

module.exports = {
  buildSummaryPost,
  platformVariants,
};
