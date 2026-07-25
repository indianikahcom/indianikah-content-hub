function section(title, items, limit = 5) {
  const rows = (items || [])
      .filter((x) => x.label !== "Not specified")
      .slice(0, limit)
      .map((x) => `- ${x.label}: ${x.count}`);

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
          `IndiaNikah - 100% free forever.`,
    };
  }

  const title =
      `${total} new matrimonial profile${total === 1 ? "" : "s"} ` +
      `in the last ${hours} hours`;

  const h = stats.highlights || {};

  return {
    title,
    content: [
      title,
      section("Gender", h.genders, 3),
      section("Age Groups", h.ageGroups, 6),
      section("Top Cities", h.cities),
      section("Top States", h.states),
      section("Occupations", h.occupations),
      section("Education", h.education),
      section("Marital Status", h.maritalStatuses),
      stats.verifiedProfiles
          ? `Verified profiles: ${stats.verifiedProfiles}`
          : null,
      "Browse the latest profiles:\nhttps://www.indianikah.com",
      "Anonymous statistics only. No individual profile details are shared.",
      "IndiaNikah - 100% free forever.",
    ]
        .filter(Boolean)
        .join("\n\n"),
  };
}

const { postText: composeXText } = require("./publishers/xPublisher");

function platformVariants(post) {
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
      platform: "X",
      title: null,
      content: composeXText(`${post.title}\n\n${post.content}`),
    },
  ];
}

module.exports = {
  buildSummaryPost,
  platformVariants,
};
