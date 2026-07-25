const prisma = require("../src/database/prisma");

const items = [
  {
    type: "HADITH",
    title: "Good character and kindness to one's wife",
    content: "A believer's character is reflected in kind conduct toward his wife and family.",
    summary: "Good character includes treating one's wife well.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Character",
    metadata: {
      arabicText: "أَكْمَلُ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا وَخِيَارُكُمْ خِيَارُكُمْ لِنِسَائِهِمْ خُلُقًا",
      englishMeaning: "The believers with the most complete faith are those with the best character, and the best among you are those who are best in conduct toward their wives.",
      authenticity: "Hasan (Darussalam)",
      narrator: "Abu Hurairah",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/tirmidhi:1162"
    },
    references: [{ type: "HADITH", reference: "Jami at-Tirmidhi 1162" }],
    tags: ["hadith", "marriage", "character", "wives", "kindness"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "The importance of sincere intention",
    content: "Actions are evaluated according to intention.",
    summary: "Sincere intention is foundational to every action.",
    language: "en",
    category: "Faith and Character",
    subcategory: "Intention",
    metadata: {
      arabicText: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
      englishMeaning: "Actions are judged by intentions, and each person will have what they intended.",
      authenticity: "Sahih",
      narrator: "Umar ibn al-Khattab",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/bukhari:1"
    },
    references: [{ type: "HADITH", reference: "Sahih al-Bukhari 1" }],
    tags: ["hadith", "intention", "sincerity", "character"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "Choose a spouse with faith as the priority",
    content: "Faith and character should be central considerations in spouse selection.",
    summary: "Prioritize religious commitment when choosing a spouse.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Spouse Selection",
    metadata: {
      arabicText: "تُنْكَحُ الْمَرْأَةُ لأَرْبَعٍ لِمَالِهَا وَلِحَسَبِهَا وَجَمَالِهَا وَلِدِينِهَا، فَاظْفَرْ بِذَاتِ الدِّينِ",
      englishMeaning: "A woman may be married for wealth, family standing, beauty, or religion; the teaching directs the believer to prioritize religious commitment.",
      authenticity: "Sahih",
      narrator: "Abu Hurairah",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/bukhari:5090"
    },
    references: [{ type: "HADITH", reference: "Sahih al-Bukhari 5090" }],
    tags: ["hadith", "marriage", "spouse-selection", "faith", "character"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "The best people are best to their families",
    content: "Excellence in character is demonstrated through kindness at home.",
    summary: "Treating one's wife and family well is a measure of good character.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Kindness",
    metadata: {
      arabicText: "خَيْرُكُمْ خَيْرُكُمْ لأَهْلِهِ وَأَنَا خَيْرُكُمْ لأَهْلِي",
      englishMeaning: "The best among you are those who are best to their families, and the Prophet described himself as the best to his family.",
      authenticity: "Sahih (Darussalam)",
      narrator: "Aishah",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/tirmidhi:3895"
    },
    references: [{ type: "HADITH", reference: "Jami at-Tirmidhi 3895" }],
    tags: ["hadith", "marriage", "wives", "husband", "family", "kindness"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "Treat women with care and kindness",
    content: "The Prophetic instruction emphasizes patient and considerate treatment of women.",
    summary: "Husbands are urged to treat their wives with care and kindness.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Husband-Wife Conduct",
    metadata: {
      arabicText: "وَاسْتَوْصُوا بِالنِّسَاءِ خَيْرًا",
      englishMeaning: "Treat women well and continue to advise one another to care for them with kindness.",
      authenticity: "Sahih",
      narrator: "Abu Hurairah",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/bukhari:5186"
    },
    references: [{ type: "HADITH", reference: "Sahih al-Bukhari 5185-5186" }],
    tags: ["hadith", "marriage", "wives", "women", "kindness", "husband"],
    status: "APPROVED"
  },
  {
    type: "DUA",
    title: "Dua for goodness in this life and the Hereafter",
    content: "A Quranic dua asking Allah for good in this world, good in the Hereafter, and protection from the Fire.",
    summary: "Ask Allah for comprehensive good in both lives.",
    language: "en",
    category: "Quranic Dua",
    subcategory: "Comprehensive Good",
    metadata: {
      quranReference: "2:201",
      sourceName: "Quran",
      sourceUrl: "https://quran.com/2/201"
    },
    references: [{ type: "QURAN", reference: "2:201" }],
    tags: ["dua", "quran", "world", "hereafter", "protection"],
    status: "APPROVED"
  },
  {
    type: "DUA",
    title: "Dua for righteous spouses and children",
    content: "A Quranic dua asking Allah to make spouses and children a comfort to the eyes and to make the believers examples for the righteous.",
    summary: "Ask Allah for a righteous and comforting family.",
    language: "en",
    category: "Quranic Dua",
    subcategory: "Marriage and Family",
    metadata: {
      quranReference: "25:74",
      sourceName: "Quran",
      sourceUrl: "https://quran.com/25/74"
    },
    references: [{ type: "QURAN", reference: "25:74" }],
    tags: ["dua", "quran", "marriage", "spouses", "children", "family"],
    status: "APPROVED"
  },
  {
    type: "DUA",
    title: "Dua for righteous offspring",
    content: "A Quranic dua asking Allah to grant good and righteous offspring.",
    summary: "Ask Allah for righteous children and family.",
    language: "en",
    category: "Quranic Dua",
    subcategory: "Children and Family",
    metadata: {
      quranReference: "3:38",
      sourceName: "Quran",
      sourceUrl: "https://quran.com/3/38"
    },
    references: [{ type: "QURAN", reference: "3:38" }],
    tags: ["dua", "quran", "marriage", "children", "offspring", "family"],
    status: "APPROVED"
  },
  {
    type: "DUA",
    title: "Dua for a family steadfast in prayer",
    content: "A Quranic dua asking Allah to make the believer and descendants steadfast in prayer and to accept the supplication.",
    summary: "Ask Allah for a prayerful and steadfast family.",
    language: "en",
    category: "Quranic Dua",
    subcategory: "Righteous Family",
    metadata: {
      quranReference: "14:40",
      sourceName: "Quran",
      sourceUrl: "https://quran.com/14/40"
    },
    references: [{ type: "QURAN", reference: "14:40" }],
    tags: ["dua", "quran", "marriage", "children", "family", "prayer"],
    status: "APPROVED"
  },
  {
    type: "DUA",
    title: "Dua for gratitude and righteous descendants",
    content: "A Quranic dua for gratitude, righteous deeds, and righteousness among one's descendants.",
    summary: "Ask Allah for gratitude, good deeds, and righteous family.",
    language: "en",
    category: "Quranic Dua",
    subcategory: "Righteous Family",
    metadata: {
      quranReference: "46:15",
      sourceName: "Quran",
      sourceUrl: "https://quran.com/46/15"
    },
    references: [{ type: "QURAN", reference: "46:15" }],
    tags: ["dua", "quran", "marriage", "children", "descendants", "family"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "Your wife has a right over you",
    content: "Marriage requires balance: worship and personal discipline must not cause neglect of a spouse's rights.",
    summary: "A wife has rights that her husband must honor.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Mutual Rights",
    metadata: {
      arabicText: "وَإِنَّ لِزَوْجِكَ عَلَيْكَ حَقًّا",
      englishMeaning: "Your wife has a right over you.",
      authenticity: "Sahih",
      narrator: "Abdullah ibn Amr ibn al-As",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/bukhari:5199"
    },
    references: [{ type: "HADITH", reference: "Sahih al-Bukhari 5199" }],
    tags: ["hadith", "marriage", "wife", "husband", "rights", "balance"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "Notice the good in your spouse",
    content: "A marriage should not be reduced to one disliked trait; spouses should recognize one another's good qualities.",
    summary: "Do not let one disliked characteristic erase appreciation for another good quality.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Patience and Appreciation",
    metadata: {
      arabicText: "لاَ يَفْرَكْ مُؤْمِنٌ مُؤْمِنَةً إِنْ كَرِهَ مِنْهَا خُلُقًا رَضِيَ مِنْهَا آخَرَ",
      englishMeaning: "A believing man should not hate a believing woman; if he dislikes one of her qualities, he should be pleased with another.",
      authenticity: "Sahih",
      narrator: "Abu Hurairah",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/muslim:1468b"
    },
    references: [{ type: "HADITH", reference: "Sahih Muslim 1468b" }],
    tags: ["hadith", "marriage", "wife", "husband", "patience", "appreciation"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "Both spouses carry family responsibilities",
    content: "Husband and wife each carry responsibility for the family and will be accountable for their trust.",
    summary: "Marriage includes shared responsibility and accountability.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Responsibility",
    metadata: {
      arabicText: "وَالرَّجُلُ رَاعٍ عَلَى أَهْلِ بَيْتِهِ، وَالْمَرْأَةُ رَاعِيَةٌ عَلَى بَيْتِ زَوْجِهَا وَوَلَدِهِ",
      englishMeaning: "A man is responsible for his family, and a woman is responsible for her husband's home and children.",
      authenticity: "Sahih",
      narrator: "Abdullah ibn Umar",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/bukhari:5200"
    },
    references: [{ type: "HADITH", reference: "Sahih al-Bukhari 5200" }],
    tags: ["hadith", "marriage", "wife", "husband", "family", "responsibility"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "Supporting one's family carries great reward",
    content: "Financial care for a spouse and family is a responsibility and a highly rewarded act.",
    summary: "Spending responsibly on one's family is among the most rewarding forms of expenditure.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Financial Care",
    metadata: {
      arabicText: "وَدِينَارٌ أَنْفَقْتَهُ عَلَى أَهْلِكَ أَعْظَمُهَا أَجْرًا الَّذِي أَنْفَقْتَهُ عَلَى أَهْلِكَ",
      englishMeaning: "Among the amounts a person spends, the one spent to support the family brings the greatest reward.",
      authenticity: "Sahih",
      narrator: "Abu Hurairah",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/muslim:995"
    },
    references: [{ type: "HADITH", reference: "Sahih Muslim 995" }],
    tags: ["hadith", "marriage", "husband", "wife", "family", "maintenance"],
    status: "APPROVED"
  },
  {
    type: "DUA",
    title: "Dua of blessing for newlyweds",
    content: "The Prophetic supplication offered to a newly married couple, asking Allah to bless them and unite them in goodness.",
    summary: "Pray for blessing and goodness between newlyweds.",
    language: "en",
    category: "Prophetic Dua",
    subcategory: "Wedding",
    metadata: {
      arabicText: "بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ",
      englishMeaning: "May Allah bless you, send blessings upon you, and bring you together in goodness.",
      authenticity: "Sahih (Darussalam)",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/tirmidhi:1091"
    },
    references: [{ type: "HADITH", reference: "Jami at-Tirmidhi 1091" }],
    tags: ["dua", "marriage", "wedding", "newlyweds", "spouses", "blessing"],
    status: "APPROVED"
  },
  {
    type: "DUA",
    title: "Dua for goodness and blessing in one's spouse",
    content: "A Prophetic dua for a person entering marriage, asking Allah for goodness and protection.",
    summary: "Ask Allah for the good in one's spouse and seek protection from harm.",
    language: "en",
    category: "Prophetic Dua",
    subcategory: "Beginning Marriage",
    metadata: {
      arabicText: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا وَخَيْرَ مَا جَبَلْتَهَا عَلَيْهِ وَأَعُوذُ بِكَ مِنْ شَرِّهَا وَمِنْ شَرِّ مَا جَبَلْتَهَا عَلَيْهِ",
      englishMeaning: "O Allah, I ask You for the good in her and the good disposition You have given her, and I seek refuge in You from harm in her and in that disposition.",
      authenticity: "Hasan (Al-Albani)",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/abudawud:2160"
    },
    references: [{ type: "HADITH", reference: "Sunan Abi Dawud 2160" }],
    tags: ["dua", "marriage", "wife", "husband", "spouse", "blessing"],
    status: "APPROVED"
  },
  {
    type: "DUA",
    title: "Dua before marital intimacy",
    content: "The Prophetic dua said before marital intimacy, seeking Allah's protection for the couple and any child granted to them.",
    summary: "Remember Allah and seek protection before marital intimacy.",
    language: "en",
    category: "Prophetic Dua",
    subcategory: "Married Life",
    metadata: {
      arabicText: "بِاسْمِ اللَّهِ، اللَّهُمَّ جَنِّبْنَا الشَّيْطَانَ، وَجَنِّبِ الشَّيْطَانَ مَا رَزَقْتَنَا",
      englishMeaning: "In the name of Allah. O Allah, keep Satan away from us and from whatever You may grant us.",
      authenticity: "Sahih",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/bukhari:6388"
    },
    references: [{ type: "HADITH", reference: "Sahih al-Bukhari 6388" }],
    tags: ["dua", "marriage", "wife", "husband", "intimacy", "children", "protection"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "A woman's consent must be sought",
    content: "Marriage requires the woman's consent; her choice is not to be ignored.",
    summary: "A previously married woman decides for herself, and a virgin must be asked for permission.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Consent",
    metadata: {
      arabicText: "الأَيِّمُ أَحَقُّ بِنَفْسِهَا مِنْ وَلِيِّهَا وَالْبِكْرُ تُسْتَأْذَنُ فِي نَفْسِهَا وَإِذْنُهَا صُمَاتُهَا",
      englishMeaning: "A previously married woman has more right to decide about herself than her guardian, and a virgin should be asked for her permission.",
      authenticity: "Sahih (Darussalam)",
      narrator: "Abdullah ibn Abbas",
      collection: "Sunan an-Nasa'i",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/nasai:3260"
    },
    references: [{ type: "HADITH", reference: "Sunan an-Nasa'i 3260" }],
    tags: ["hadith", "marriage", "wife", "consent", "guardian", "rights"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "Good treatment of one's wife",
    content: "The quality of a person's character is visible in how they treat their spouse at home.",
    summary: "The best people are those who are best to their wives.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Kindness",
    metadata: {
      arabicText: "خَيْرُكُمْ خَيْرُكُمْ لأَهْلِهِ وَأَنَا خَيْرُكُمْ لأَهْلِي",
      englishMeaning: "The best among you are those who are best to their wives and families.",
      authenticity: "Hasan (Darussalam)",
      narrator: "Abdullah ibn Abbas",
      collection: "Sunan Ibn Majah",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/ibnmajah:1977"
    },
    references: [{ type: "HADITH", reference: "Sunan Ibn Majah 1977" }],
    tags: ["hadith", "marriage", "wife", "husband", "family", "kindness"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "Provide for a wife without abuse",
    content: "A wife's rights include food, clothing, dignity, and protection from physical and verbal abuse.",
    summary: "A husband must provide for his wife and must not strike her face or insult her.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Wife's Rights",
    metadata: {
      arabicText: "أَنْ تُطْعِمَهَا إِذَا طَعِمْتَ وَتَكْسُوَهَا إِذَا اكْتَسَيْتَ وَلاَ تَضْرِبِ الْوَجْهَ وَلاَ تُقَبِّحْ",
      englishMeaning: "Feed her when you eat, clothe her when you clothe yourself, do not strike her face, and do not insult her.",
      authenticity: "Hasan Sahih (Al-Albani)",
      narrator: "Muawiyah al-Qushayri",
      collection: "Sunan Abi Dawud",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/abudawud:2142"
    },
    references: [{ type: "HADITH", reference: "Sunan Abi Dawud 2142" }],
    tags: ["hadith", "marriage", "wife", "husband", "rights", "maintenance", "dignity"],
    status: "APPROVED"
  },
  {
    type: "HADITH",
    title: "Consent in marriage in al-Muwatta",
    content: "The al-Muwatta narration records the requirement to consult a woman about her marriage.",
    summary: "A previously married woman decides for herself, and a virgin is asked for permission.",
    language: "en",
    category: "Marriage and Family",
    subcategory: "Consent",
    metadata: {
      arabicText: "الأَيِّمُ أَحَقُّ بِنَفْسِهَا مِنْ وَلِيِّهَا وَالْبِكْرُ تُسْتَأْذَنُ فِي نَفْسِهَا وَإِذْنُهَا صُمَاتُهَا",
      englishMeaning: "A previously married woman has more right over her own decision than her guardian, and a virgin must be asked for consent.",
      authenticity: "Connected Prophetic narration in al-Muwatta; also recorded as Sahih in Sunan an-Nasa'i 3260",
      narrator: "Abdullah ibn Abbas",
      collection: "Muwatta Malik",
      sourceName: "Sunnah.com",
      sourceUrl: "https://sunnah.com/urn/510970"
    },
    references: [{ type: "HADITH", reference: "Muwatta Malik, Book 28, Hadith 4 (Arabic 1097)" }],
    tags: ["hadith", "marriage", "wife", "consent", "guardian", "muwatta"],
    status: "APPROVED"
  }
];

function inferCollection(data) {
  const reference = JSON.stringify(data.references || []);
  const collections = [
    "Sahih al-Bukhari",
    "Sahih Muslim",
    "Jami at-Tirmidhi",
    "Sunan Abi Dawud",
    "Sunan an-Nasa'i",
    "Sunan Ibn Majah",
    "Muwatta Malik"
  ];
  return collections.find((collection) => reference.includes(collection)) || null;
}

async function main() {
  const packs = await prisma.knowledgePack.findMany({
    where: { key: { in: ["HADITH_CONTENT", "DUA_CONTENT"] } }
  });
  const packByKey = new Map(packs.map((pack) => [pack.key, pack]));

  for (const data of items) {
    data.metadata = {
      ...data.metadata,
      collection: data.metadata?.collection || inferCollection(data),
      verificationStatus: "CURATED_REFERENCE_CHECKED"
    };
    const item = await prisma.knowledgeItem.upsert({
      where: {
        type_title_language: {
          type: data.type,
          title: data.title,
          language: data.language
        }
      },
      create: data,
      update: data
    });
    const pack = packByKey.get(
      data.type === "HADITH" ? "HADITH_CONTENT" : "DUA_CONTENT"
    );
    if (!pack) throw new Error(`Missing knowledge pack for ${data.type}`);
    await prisma.knowledgePackItem.upsert({
      where: {
        packId_knowledgeItemId: {
          packId: pack.id,
          knowledgeItemId: item.id
        }
      },
      create: {
        packId: pack.id,
        knowledgeItemId: item.id,
        priority: 10
      },
      update: { priority: 10 }
    });
  }

  console.log(`Seeded ${items.length} approved Hadith and Dua items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
