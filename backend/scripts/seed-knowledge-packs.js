const prisma = require("../src/database/prisma");

const packs = [
  { key: "QURAN_CONTENT", name: "Quran Content", description: "Approved Quran verses, translations and themes.", instructions: "Quote the surah and ayah reference exactly as stored. Never invent tafsir or a translation.", contentTypes: ["QURAN"], languages: ["en", "ur", "hi"], tags: ["quran", "islamic"], maxItems: 6 },
  { key: "HADITH_CONTENT", name: "Hadith Content", description: "Authenticated Hadith for marriage and husband-wife relationship posts.", instructions: "Use only authenticated Hadith about marriage, spouses, husband-wife rights, kindness, and family conduct. Include collection/reference and authenticity when available. Do not present weak or unverified reports as authentic.", contentTypes: ["HADITH"], languages: ["en", "ur", "hi"], tags: ["hadith", "sunnah", "marriage", "spouses", "family"], maxItems: 6 },
  { key: "DUA_CONTENT", name: "Dua Content", description: "Curated duas for marriage, spouses, and righteous family relationships.", instructions: "Use only duas relevant to marriage, spouses, children, and righteous family life. Preserve Arabic text and references exactly. Do not claim a virtue unless it exists in the source.", contentTypes: ["DUA"], languages: ["en", "ur", "hi"], tags: ["dua", "marriage", "spouses", "family"], maxItems: 5 },
  { key: "MARRIAGE_GUIDANCE", name: "Marriage Guidance", description: "Quran, Hadith and practical IndiaNikah marriage guidance.", instructions: "Prioritize sound Islamic principles, practical advice, privacy and respectful language. Avoid legal or medical certainty.", contentTypes: ["QURAN", "HADITH", "MARRIAGE_GUIDE", "MARRIAGE_TIP", "FAMILY_LIFE", "ISLAMIC_ARTICLE"], languages: ["en", "ur", "hi"], tags: ["marriage", "family", "nikah"], maxItems: 10 },
  { key: "BOOK_PROMOTION", name: "Book Promotion", description: "Book summaries and approved promotional context.", instructions: "Use only stored title, author, language, description and link. Do not invent chapters or endorsements.", contentTypes: ["BOOK"], languages: ["en", "ur", "hi"], tags: ["book", "reading"], maxItems: 5 },
  { key: "PROFILE_SUMMARY", name: "Profile Summary", description: "IndiaNikah policy and approved statistical context for profile summaries.", instructions: "Use exact live statistics supplied in source data. Never expose private profile fields or infer sensitive attributes.", contentTypes: ["PROFILE", "STATISTICS", "MANUAL"], languages: ["en"], tags: ["profiles", "privacy", "indianikah"], maxItems: 8 },
  { key: "INDIANIKAH_BRAND", name: "IndiaNikah Brand", description: "Mission, tone, policies, CTAs and brand rules.", instructions: "Apply IndiaNikah's trust-first, privacy-first and 100% free forever positioning. Do not make unsupported promises.", contentTypes: ["MANUAL", "AI_INSIGHT"], languages: ["en", "ur", "hi"], tags: ["brand", "indianikah", "policy"], maxItems: 8 },
  { key: "CURRENT_AFFAIRS", name: "Current Affairs", description: "Approved news and official updates.", instructions: "State dates and source references. Do not present stale information as current. Use plain text with ASCII punctuation only; do not use emojis or decorative symbols.", contentTypes: ["NEWS", "EXTERNAL_API"], languages: ["en", "ur", "hi"], tags: ["news", "update"], maxItems: 8 },
];

async function main() {
  for (const pack of packs) {
    await prisma.knowledgePack.upsert({ where: { key: pack.key }, create: pack, update: pack });
  }
  console.log(`Seeded ${packs.length} knowledge packs.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
