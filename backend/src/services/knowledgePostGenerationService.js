const prisma = require("../database/prisma");
const AppError = require("../errors/AppError");
const aiClient = require("./aiClient");
const knowledgeContextService = require("./knowledgeContextService");
const { fetchArabicByReference } = require("./quranArabicService");

const INDIANIKAH_BRAND_FOOTER = [
    "IndiaNikah.com - 100% free forever for Indian Muslims.",
    "Find your compatible match: https://www.indianikah.com",
].join("\n");

const TOPICS = {
    QURAN: {
        packKey: "QURAN_CONTENT",
        label: "Quran",
        instruction:
            "Create a short respectful reflection based only on the supplied Quran knowledge. Do not reproduce the Arabic verse, translation, or surah/ayah citation because the application appends the verified text and reference. Do not invent tafsir, virtues, or rulings.",
    },
    HADITH: {
        packKey: "HADITH_CONTENT",
        label: "Hadith",
        instruction:
            "Create a short respectful reflection about marriage and healthy husband-wife conduct based only on the supplied Hadith knowledge. Do not reproduce the Arabic, English meaning, grade, or reference because the application appends the verified source fields. Do not invent wording, grading, virtues, or rulings.",
    },
    DUA: {
        packKey: "DUA_CONTENT",
        label: "Dua",
        instruction:
            "Create a short respectful introduction about dua for marriage, spouses, and righteous family relationships based only on the supplied Dua knowledge. Do not reproduce the Arabic, translation, or reference because the application appends the verified source fields. Do not invent wording, virtues, occasions, or religious claims.",
    },
};

function hasReference(item) {
    if (!item?.references) return false;
    if (Array.isArray(item.references)) return item.references.length > 0;
    if (typeof item.references === "object") {
        return Object.keys(item.references).length > 0;
    }
    return String(item.references).trim().length > 0;
}

function containsArabic(value) {
    return /[\u0600-\u06FF]/u.test(String(value || ""));
}

function extractArabicLines(value) {
    return String(value || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && containsArabic(line))
        .join("\n");
}

function stripGeneratedReferenceLines(value) {
    return String(value || "")
        .split(/\r?\n/)
        .filter(
            (line) =>
                !/^\s*(?:source\s+)?reference(?:s)?\s*:/i.test(line)
        )
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function stripQuranReferenceMentions(value, reference) {
    if (!reference) return String(value || "");
    const escaped = String(reference).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "i");

    return String(value || "")
        .split(/\r?\n/)
        .filter((line) => !pattern.test(line))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function quranReference(item) {
    const metadataReference = item?.metadata?.quranReference;
    if (metadataReference) return String(metadataReference);

    const references = Array.isArray(item?.references)
        ? item.references
        : [item?.references];
    const quran = references.find(
        (reference) =>
            String(reference?.type || "").toUpperCase() === "QURAN" &&
            reference?.reference
    );

    return quran ? String(quran.reference) : null;
}

function metadataValue(item, key) {
    const value = item?.metadata?.[key];
    return value ? String(value).trim() : "";
}

function isMarriageRelationshipItem(item) {
    const tags = Array.isArray(item?.tags)
        ? item.tags.join(" ")
        : JSON.stringify(item?.tags || "");
    const searchable = [
        item?.title,
        item?.summary,
        item?.category,
        item?.subcategory,
        tags,
    ].join(" ").toLowerCase();

    return /\b(?:marriage|marital|spouse|spouses|wife|wives|husband|family|nikah)\b/.test(
        searchable
    );
}

function displayReference(item) {
    const quran = quranReference(item);
    if (quran) return `Quran ${quran}`;

    const references = Array.isArray(item?.references)
        ? item.references
        : [item?.references];
    const reference = references.find(Boolean);

    return String(
        reference?.reference ||
        reference?.citation ||
        reference?.source ||
        reference ||
        ""
    ).trim();
}

function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

async function generateKnowledgePost(type) {
    const normalizedType = String(type || "").trim().toUpperCase();
    const topic = TOPICS[normalizedType];

    if (!topic) {
        throw new AppError(
            "Knowledge post type must be QURAN, HADITH, or DUA",
            400
        );
    }

    const context = await knowledgeContextService.buildContext({
        query: `${topic.label} authentic referenced social media post`,
        packKey: topic.packKey,
        types: [normalizedType],
        maxItems: 20,
        maxCharacters: 40000,
        generationType: normalizedType,
        logUsage: false,
    });
    const referencedItems = context.items.filter(
        (item) =>
            hasReference(item) &&
            (
                normalizedType === "QURAN" ||
                isMarriageRelationshipItem(item)
            ) &&
            (
                normalizedType !== "QURAN" ||
                quranReference(item)
            )
    );

    if (!referencedItems.length) {
        throw new AppError(
            normalizedType === "QURAN"
                ? "No approved Quran knowledge item with a valid stored reference is available"
                : `No approved marriage or husband-wife ${topic.label} item with a reference is available`,
            422
        );
    }

    const selected = randomItem(referencedItems);
    const referenceText = JSON.stringify(selected.references);
    const storedArabic =
        metadataValue(selected, "arabicText") ||
        extractArabicLines(selected.content);
    const storedTranslation =
        metadataValue(selected, "englishTranslation") ||
        metadataValue(selected, "englishMeaning");
    const storedAuthenticity =
        metadataValue(selected, "authenticity") ||
        metadataValue(selected, "grade");
    const selectedQuranReference = quranReference(selected);
    const fetchedArabic =
        selectedQuranReference &&
        ["QURAN", "DUA"].includes(normalizedType)
            ? await fetchArabicByReference(selectedQuranReference)
            : null;
    const verifiedArabic =
        storedArabic || fetchedArabic?.text || "";
    const verifiedTranslation =
        storedTranslation || fetchedArabic?.translation || "";

    if (!verifiedArabic || !verifiedTranslation) {
        throw new AppError(
            `The selected ${topic.label} item is missing verified Arabic or English ${normalizedType === "HADITH" ? "meaning" : "translation"}`,
            422
        );
    }

    if (normalizedType === "HADITH" && !storedAuthenticity) {
        throw new AppError(
            "The selected Hadith item is missing an authenticity grade",
            422
        );
    }
    const sourceArabicLabel =
        normalizedType === "QURAN"
            ? "Verified Arabic verse"
            : normalizedType === "HADITH"
                ? "Verified Arabic Hadith"
                : "Verified Arabic Dua";
    const sourceTranslationLabel =
        normalizedType === "HADITH"
            ? "Verified English meaning"
            : `Verified English translation${fetchedArabic?.translationName ? ` (${fetchedArabic.translationName})` : ""}`;
    const sourceText = [
        `Type: ${selected.type}`,
        `Title: ${selected.title}`,
        `Language: ${selected.language}`,
        `Content:\n${selected.content}`,
        verifiedArabic ? `${sourceArabicLabel}:\n${verifiedArabic}` : null,
        verifiedTranslation
            ? `${sourceTranslationLabel}:\n${verifiedTranslation}`
            : null,
        `Reference:\n${referenceText}`,
    ].filter(Boolean).join("\n\n");

    const result = await aiClient.generateJson({
        systemPrompt: [
            "You write trustworthy social media content for IndiaNikah.",
            "Use only the supplied approved knowledge item.",
            "Never invent, alter, merge, or guess religious text or references.",
            "Do not add a reference line; the application appends the verified stored reference.",
            "If the supplied material is insufficient, do not add outside claims.",
            "Return valid JSON with exactly the keys title and content.",
        ].join("\n"),
        userPrompt: `${topic.instruction}\n\nAPPROVED KNOWLEDGE:\n${sourceText}`,
    });
    const generatedContentWithoutReferenceLines =
        stripGeneratedReferenceLines(result.content);
    const generatedContent =
        ["QURAN", "HADITH", "DUA"].includes(normalizedType)
            ? stripQuranReferenceMentions(
                generatedContentWithoutReferenceLines,
                displayReference(selected)
            )
            : generatedContentWithoutReferenceLines;
    const arabicText = verifiedArabic;
    const outputArabicLabel =
        normalizedType === "QURAN"
            ? "Arabic verse"
            : normalizedType === "HADITH"
                ? "Arabic Hadith"
                : "Arabic Dua";
    const contentWithArabic =
        arabicText && !generatedContent.includes(arabicText)
            ? `${generatedContent}\n\n${outputArabicLabel}:\n${arabicText}`
            : generatedContent;
    const translationLabel =
        normalizedType === "HADITH"
            ? "English meaning"
            : `English translation${fetchedArabic?.translationName ? ` (${fetchedArabic.translationName})` : ""}`;
    const contentWithTranslation =
        `${contentWithArabic}\n\n${translationLabel}:\n${verifiedTranslation}`;
    const contentWithAuthenticity =
        storedAuthenticity
            ? `${contentWithTranslation}\n\nAuthenticity: ${storedAuthenticity}`
            : contentWithTranslation;
    const readableReference = displayReference(selected);
    const referencedContent =
        `${contentWithAuthenticity}\n\nSource reference: ${readableReference}\n\n${INDIANIKAH_BRAND_FOOTER}`;

    const created = await prisma.$transaction(async (tx) => {
        const source = await tx.contentSource.create({
            data: {
                type: normalizedType,
                title: selected.title,
                sourceUrl: null,
                externalId: `knowledge-generation:${normalizedType}:${selected.id}:${Date.now()}`,
                rawContent: selected.content,
                metadata: JSON.stringify({
                    knowledgeItemId: selected.id,
                    knowledgeType: normalizedType,
                    knowledgePack: topic.packKey,
                    references: selected.references,
                    arabicTextSource: fetchedArabic
                        ? {
                            provider: fetchedArabic.source,
                            edition: fetchedArabic.edition,
                            translationEdition:
                                fetchedArabic.translationEdition,
                            translationName:
                                fetchedArabic.translationName,
                            reference: fetchedArabic.reference,
                        }
                        : {
                            provider:
                                metadataValue(selected, "sourceName") ||
                                "APPROVED_KNOWLEDGE_ITEM",
                            sourceUrl:
                                metadataValue(selected, "sourceUrl") ||
                                null,
                        },
                    generatedWithApprovedKnowledge: true,
                }),
                status: "PROCESSED",
            },
        });

        const post = await tx.post.create({
            data: {
                title: result.title,
                content: referencedContent,
                status: "DRAFT",
                sourceId: source.id,
            },
        });

        await tx.generationLog.create({
            data: {
                postId: post.id,
                sourceId: source.id,
                contentType: normalizedType,
                provider: "OPENAI",
                model: result.model,
                status: "SUCCESS",
                promptKey: `${normalizedType}_KNOWLEDGE`,
            },
        });

        return { post, source };
    });

    return {
        ...created,
        knowledgeItem: {
            id: selected.id,
            type: selected.type,
            title: selected.title,
            references: selected.references,
        },
        provider: "OPENAI",
        model: result.model,
    };
}

module.exports = {
    generateKnowledgePost,
};
