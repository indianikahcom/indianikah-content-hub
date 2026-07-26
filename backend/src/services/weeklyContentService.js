const prisma = require("../database/prisma");
const aiClient = require("./aiClient");
const randomDraftService = require("./randomDraftService");
const knowledgePostGenerationService = require("./knowledgePostGenerationService");
const platformComposerService = require("./platformComposerService");
const automationService = require("./automationService");
const AppError = require("../errors/AppError");

const WEEKLY_TYPES = Object.freeze({
    0: "DUA",
    1: "NEWS",
    2: "BLOG",
    3: "BOOK",
    4: "VIDEO",
    5: "QURAN",
    6: "HADITH",
});

function indiaWeekday(date = new Date()) {
    const label = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
    }).format(date);
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(label);
}

async function createApprovedKnowledgeDraft(type) {
    const items = await prisma.knowledgeItem.findMany({
        where: { type, status: "APPROVED" },
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: 100,
    });

    if (!items.length) {
        throw new AppError(`No approved ${type.toLowerCase()} knowledge is available`, 404);
    }

    const usedSources = await prisma.contentSource.findMany({
        where: {
            externalId: { startsWith: `weekly-knowledge:${type}:` },
        },
        select: { externalId: true },
    });
    const usedIds = new Set(
        usedSources.map((source) => Number(source.externalId.split(":")[2]))
    );
    const selected = items.find((item) => !usedIds.has(item.id)) || items[0];
    const result = await aiClient.generateJson({
        systemPrompt: [
            "You write accurate social media content for IndiaNikah.",
            "Use only the supplied approved knowledge.",
            "Do not invent facts, dates, quotations, people, links, or claims.",
            "Return valid JSON with exactly the keys title and content.",
        ].join("\n"),
        userPrompt: [
            `Create one concise ${type.toLowerCase()} post.`,
            type === "NEWS"
                ? "State the supplied date and source clearly; do not describe old material as breaking news."
                : "Describe only the supplied video and include its stored link when present.",
            `Title: ${selected.title}`,
            `Summary: ${selected.summary || ""}`,
            `Content: ${selected.content}`,
            `References: ${JSON.stringify(selected.references || [])}`,
            `Metadata: ${JSON.stringify(selected.metadata || {})}`,
        ].join("\n\n"),
    });

    const sequence = await prisma.contentSource.count({
        where: { externalId: { startsWith: `weekly-knowledge:${type}:${selected.id}:` } },
    });
    const created = await prisma.$transaction(async (tx) => {
        const source = await tx.contentSource.create({
            data: {
                type,
                title: selected.title,
                sourceUrl: selected.metadata?.sourceUrl || null,
                externalId: `weekly-knowledge:${type}:${selected.id}:${sequence + 1}`,
                rawContent: selected.content,
                metadata: JSON.stringify({
                    knowledgeItemId: selected.id,
                    references: selected.references,
                }),
                status: "PROCESSED",
            },
        });
        const post = await tx.post.create({
            data: {
                title: result.title,
                content: result.content,
                status: "DRAFT",
                sourceId: source.id,
            },
        });
        return { post, source };
    });

    return created;
}

async function createDraft(type) {
    if (["QURAN", "HADITH", "DUA"].includes(type)) {
        return knowledgePostGenerationService.generateKnowledgePost(type);
    }
    if (["BOOK", "BLOG"].includes(type)) {
        return randomDraftService.createRandomDraft({
            type,
            platform: "TELEGRAM",
        });
    }
    return createApprovedKnowledgeDraft(type);
}

async function generateAndPublishForToday(date = new Date()) {
    const type = WEEKLY_TYPES[indiaWeekday(date)];
    const generated = await createDraft(type);
    const postId = generated?.post?.id;

    if (!postId) throw new AppError(`Failed to create the scheduled ${type} post`, 500);

    await platformComposerService.composeForPost(postId);
    const publishing = await automationService.autoApprovePost(postId);

    return { type, postId, publishing };
}

module.exports = {
    WEEKLY_TYPES,
    indiaWeekday,
    generateAndPublishForToday,
};
