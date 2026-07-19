const prisma = require("../database/prisma");
const AppError = require("../errors/AppError");
const aiGenerationService = require("./aiGenerationService");
const platformComposerService = require("./platformComposerService");
const { createTemplateDraft } = require("./milestone3TemplateService");

function normalizeProvider(value) {
    const provider = String(value || "AUTO").trim().toUpperCase();
    if (!["AUTO", "OPENAI", "TEMPLATE"].includes(provider)) {
        throw new AppError("provider must be AUTO, OPENAI, or TEMPLATE", 400);
    }
    if (provider === "AUTO") {
        return String(process.env.AI_GENERATION_ENABLED).toLowerCase() === "true" && process.env.OPENAI_API_KEY
            ? "OPENAI"
            : "TEMPLATE";
    }
    return provider;
}

async function findSource(sourceId) {
    const id = Number(sourceId);
    if (!Number.isInteger(id) || id < 1) throw new AppError("Invalid source ID", 400);
    const source = await prisma.contentSource.findUnique({ where: { id }, include: { posts: { orderBy: { createdAt: "desc" }, take: 1 } } });
    if (!source) throw new AppError("Content source not found", 404);
    return source;
}

async function generateTemplate(source, replaceExisting) {
    const draft = createTemplateDraft(source);
    let post;

    if (source.posts?.[0]) {
        if (!replaceExisting) throw new AppError("A post already exists for this source. Set replaceExisting=true to regenerate it.", 409);
        if (source.posts?.[0].status === "APPROVED") throw new AppError("Approved posts cannot be regenerated. Move the post back to DRAFT first.", 409);
        post = await prisma.post.update({
            where: { id: source.posts?.[0].id },
            data: { title: draft.title, content: draft.content, status: "DRAFT" }
        });
    } else {
        post = await prisma.$transaction(async (tx) => {
            const created = await tx.post.create({
                data: { title: draft.title, content: draft.content, status: "DRAFT", sourceId: source.id }
            });
            await tx.contentSource.update({ where: { id: source.id }, data: { status: "PROCESSED" } });
            return created;
        });
    }

    await prisma.generationLog.create({
        data: {
            postId: post.id,
            sourceId: source.id,
            contentType: source.type,
            provider: "TEMPLATE",
            model: "MILESTONE_3_TEMPLATE_V1",
            status: "SUCCESS",
            promptKey: `TEMPLATE_${source.type}`
        }
    });

    return { post, sourceId: source.id, provider: "TEMPLATE", model: "MILESTONE_3_TEMPLATE_V1" };
}

async function generateFromSource(sourceId, options = {}) {
    const source = await findSource(sourceId);
    const provider = normalizeProvider(options.provider);
    const replaceExisting = Boolean(options.replaceExisting);
    const composePlatforms = options.composePlatforms !== false;

    let generation;
    if (provider === "OPENAI") {
        generation = await aiGenerationService.generateForSource(source.id, { replaceExisting });
    } else {
        generation = await generateTemplate(source, replaceExisting);
    }

    const variants = composePlatforms
        ? await platformComposerService.composeForPost(generation.post.id)
        : { postId: generation.post.id, count: 0, variants: [] };

    return {
        sourceId: source.id,
        post: generation.post,
        provider: generation.provider || provider,
        model: generation.model || null,
        platformVariants: variants.variants,
        variantCount: variants.count,
        approvalReady: {
            postStatus: generation.post.status,
            nextAction: "Review/edit variants, then move the post to PENDING_APPROVAL."
        }
    };
}

async function generateBatch(options = {}) {
    const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 50);
    const type = options.type ? String(options.type).trim().toUpperCase() : undefined;
    const sources = await prisma.contentSource.findMany({
        where: { status: "NEW", post: null, ...(type ? { type } : {}) },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit
    });

    const results = [];
    for (const source of sources) {
        try {
            const data = await generateFromSource(source.id, options);
            results.push({ sourceId: source.id, success: true, postId: data.post.id, variantCount: data.variantCount, provider: data.provider });
        } catch (error) {
            results.push({ sourceId: source.id, success: false, error: error.message });
        }
    }

    return {
        requested: limit,
        selected: sources.length,
        succeeded: results.filter((item) => item.success).length,
        failed: results.filter((item) => !item.success).length,
        results
    };
}

async function getPreview(postId) {
    const id = Number(postId);
    if (!Number.isInteger(id) || id < 1) throw new AppError("Invalid post ID", 400);
    const post = await prisma.post.findUnique({
        where: { id },
        include: { source: true, variants: { orderBy: { platform: "asc" } } }
    });
    if (!post) throw new AppError("Post not found", 404);
    return post;
}

module.exports = { generateFromSource, generateBatch, getPreview };
