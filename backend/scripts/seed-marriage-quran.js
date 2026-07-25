const prisma = require("../src/database/prisma");

const verses = [
  { ref: "2:187", title: "Spouses are garments for one another", summary: "Marriage is described through mutual closeness, protection, dignity and comfort between spouses.", tags: ["marriage","spouses","closeness","protection","intimacy"] },
  { ref: "2:221", title: "Faith and marriage choices", summary: "Believers are instructed to prioritize faith when choosing a spouse and to avoid marriages that compromise belief.", tags: ["spouse-selection","faith","compatibility","nikah"] },
  { ref: "2:226-227", title: "Oaths of abstinence and marital responsibility", summary: "The passage regulates prolonged abstinence within marriage and requires a responsible resolution rather than indefinite harm.", tags: ["marital-rights","separation","responsibility"] },
  { ref: "2:228", title: "Mutual rights and responsibilities", summary: "Women have rights corresponding to their responsibilities in a fair manner, while the passage also sets rules concerning divorce and reconciliation.", tags: ["rights","responsibilities","divorce","reconciliation","fairness"] },
  { ref: "2:229-230", title: "Divorce limits and respectful release", summary: "Divorce is limited and regulated; spouses must either continue honorably or separate with kindness, without taking back gifts unjustly.", tags: ["divorce","kindness","khula","justice","separation"] },
  { ref: "2:231-232", title: "Do not harm or obstruct reconciliation", summary: "Former spouses must not be retained to cause harm, and guardians must not prevent lawful remarriage when both parties agree honorably.", tags: ["remarriage","guardians","reconciliation","harm","divorce"] },
  { ref: "2:233", title: "Shared parental and financial responsibility", summary: "Parents are instructed to cooperate regarding breastfeeding, maintenance and decisions affecting their child without harming one another.", tags: ["parenting","maintenance","cooperation","children","family"] },
  { ref: "4:1", title: "Human family and kinship", summary: "Humanity is reminded of its shared origin and the importance of reverence for Allah and maintaining family ties.", tags: ["family","kinship","taqwa","humanity"] },
  { ref: "4:3", title: "Justice in plural marriage", summary: "Plural marriage is conditioned on justice; where justice is feared, the instruction is to marry only one.", tags: ["polygyny","justice","marriage","responsibility"] },
  { ref: "4:4", title: "Give women their dowries", summary: "Women must be given their marriage gifts freely and directly, and any voluntary remission must be genuinely willing.", tags: ["mahr","dowry","women-rights","nikah"] },
  { ref: "4:19", title: "Live with spouses in kindness", summary: "Women must not be inherited or constrained against their will; husbands are instructed to live with their wives honorably and patiently.", tags: ["kindness","husband-wife","women-rights","patience"] },
  { ref: "4:20-21", title: "Marriage covenant and financial integrity", summary: "A spouse must not be falsely accused or pressured to recover what was given, because marriage is a solemn covenant.", tags: ["covenant","mahr","justice","separation"] },
  { ref: "4:25", title: "Marriage, consent and chastity", summary: "The passage addresses lawful marriage, consent, financial rights and chastity for those with limited means.", tags: ["consent","mahr","chastity","marriage"] },
  { ref: "4:34", title: "Family responsibility and conduct", summary: "The verse assigns financial responsibility within the family and addresses serious marital discord; it must be handled with the wider Quranic principles of justice, kindness and non-oppression.", tags: ["family-responsibility","maintenance","marital-discord","justice"] },
  { ref: "4:35", title: "Arbitration in marital conflict", summary: "When a serious breach is feared, a trusted representative from each family should help seek reconciliation.", tags: ["conflict-resolution","arbitration","reconciliation","family"] },
  { ref: "4:128-130", title: "Settlement, fairness and separation", summary: "Spouses may reach a fair settlement when neglect or estrangement is feared; justice is emphasized, and dignified separation remains permitted when reconciliation fails.", tags: ["settlement","fairness","neglect","separation","reconciliation"] },
  { ref: "5:5", title: "Lawful marriage and chastity", summary: "Marriage is presented as a lawful, chaste covenant rather than a secret or exploitative relationship.", tags: ["chastity","interfaith","marriage","covenant"] },
  { ref: "7:189", title: "A spouse as a source of companionship", summary: "The creation of spouses is described as a means of companionship, closeness and family formation.", tags: ["companionship","creation","spouses","family"] },
  { ref: "16:72", title: "Spouses, children and family blessings", summary: "Spouses, children and grandchildren are mentioned among Allah's blessings and provisions.", tags: ["family","children","blessing","gratitude"] },
  { ref: "24:26", title: "Moral compatibility and innocence", summary: "The passage rejects slander and highlights moral purity; it should not be used simplistically to judge every marriage outcome.", tags: ["character","slander","purity","compatibility"] },
  { ref: "24:32-33", title: "Encourage marriage and preserve chastity", summary: "The community is encouraged to help unmarried people marry, while those without means are instructed to remain chaste until Allah provides.", tags: ["nikah","community","financial-readiness","chastity"] },
  { ref: "25:54", title: "Lineage and marriage ties", summary: "Human relationships through blood and marriage are described as part of Allah's creation and order.", tags: ["kinship","marriage-ties","family"] },
  { ref: "25:74", title: "Prayer for righteous spouses and children", summary: "Believers pray for spouses and children who bring comfort to the eyes and for leadership in righteousness.", tags: ["dua","spouses","children","righteous-family"] },
  { ref: "30:21", title: "Tranquility, affection and mercy", summary: "Marriage is described as a sign of Allah through tranquility between spouses and the creation of affection and mercy.", tags: ["sakinah","love","mercy","husband-wife","marriage"] },
  { ref: "33:35", title: "Equal spiritual worth of believing men and women", summary: "Believing men and women are equally addressed in faith, worship, truthfulness, patience, charity, chastity and remembrance of Allah.", tags: ["spiritual-equality","men","women","character"] },
  { ref: "33:49", title: "Dignified separation before consummation", summary: "Where divorce occurs before consummation, the woman must be released graciously without an imposed waiting period.", tags: ["divorce","dignity","kindness","waiting-period"] },
  { ref: "49:13", title: "Character over tribe and status", summary: "Human diversity is for recognition, while true honor is based on God-consciousness rather than lineage, ethnicity or social status.", tags: ["spouse-selection","character","taqwa","caste","ethnicity"] },
  { ref: "58:1-4", title: "A wife's complaint was heard", summary: "The passage addresses a woman's marital complaint and abolishes an unjust pre-Islamic form of separation, demonstrating accountability and access to justice.", tags: ["women-rights","complaint","justice","separation"] },
  { ref: "60:10", title: "Faith, migration and marital bonds", summary: "The verse regulates marital status when believing women migrate from hostile circumstances and clarifies financial obligations.", tags: ["faith","migration","marital-status","financial-rights"] },
  { ref: "64:14-15", title: "Family can be a test", summary: "Spouses and children may become a test; believers are told to remain cautious while also forgiving, overlooking and showing mercy.", tags: ["family-test","forgiveness","mercy","children","spouses"] },
  { ref: "65:1-2", title: "Divorce procedure and witnesses", summary: "Divorce must follow a regulated process, with accurate waiting periods, no wrongful expulsion and reliable witnessing.", tags: ["divorce","procedure","iddah","witnesses","housing"] },
  { ref: "65:3-5", title: "Trust in Allah during family difficulty", summary: "The passage connects lawful conduct during divorce with reliance on Allah and the promise of ease for those who remain mindful of Him.", tags: ["tawakkul","divorce","taqwa","difficulty"] },
  { ref: "65:6-7", title: "Housing, maintenance and consultation", summary: "Women in the waiting period must be housed and maintained without harassment; parents should consult fairly about nursing and expenses.", tags: ["maintenance","housing","consultation","parenting","divorce"] },
  { ref: "66:6", title: "Protect your families", summary: "Believers are instructed to protect themselves and their families through faith, teaching and responsible conduct.", tags: ["family","responsibility","education","faith"] }
];

function itemData(v) {
  return {
    type: "QURAN",
    title: `Quran ${v.ref} — ${v.title}`,
    content: `Quran reference: ${v.ref}\nEditorial meaning summary: ${v.summary}\n\nImportant: Before publishing a direct quotation, use an approved Quran translation and preserve the surah/ayah reference exactly. Do not invent tafsir or attribute this editorial summary as a verbatim translation.`,
    summary: v.summary,
    language: "en",
    category: "Marriage and Family",
    subcategory: "Quran",
    metadata: {
      quranReference: v.ref,
      editorialSummary: true,
      directTranslationIncluded: false,
      reviewNote: "Reference and editorial meaning summary are preloaded. Add approved Arabic/translation text before publishing a direct quotation."
    },
    references: [{ type: "QURAN", reference: v.ref }],
    tags: ["quran", "marriage", "family", ...v.tags],
    status: "APPROVED"
  };
}

async function main() {
  const quranPack = await prisma.knowledgePack.findUnique({ where: { key: "QURAN_CONTENT" } });
  const marriagePack = await prisma.knowledgePack.findUnique({ where: { key: "MARRIAGE_GUIDANCE" } });
  if (!quranPack || !marriagePack) {
    throw new Error("Required packs are missing. Run `npm run knowledge:seed` first.");
  }

  let createdOrUpdated = 0;
  for (const verse of verses) {
    const data = itemData(verse);
    const item = await prisma.knowledgeItem.upsert({
      where: { type_title_language: { type: data.type, title: data.title, language: data.language } },
      create: data,
      update: data
    });

    await prisma.knowledgePackItem.upsert({
      where: { packId_knowledgeItemId: { packId: quranPack.id, knowledgeItemId: item.id } },
      create: { packId: quranPack.id, knowledgeItemId: item.id, priority: 20 },
      update: { priority: 20 }
    });
    await prisma.knowledgePackItem.upsert({
      where: { packId_knowledgeItemId: { packId: marriagePack.id, knowledgeItemId: item.id } },
      create: { packId: marriagePack.id, knowledgeItemId: item.id, priority: 30 },
      update: { priority: 30 }
    });
    createdOrUpdated += 1;
  }

  console.log(`Seeded ${createdOrUpdated} approved marriage-and-family Quran knowledge items.`);
  console.log("Assigned every item to QURAN_CONTENT and MARRIAGE_GUIDANCE.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
