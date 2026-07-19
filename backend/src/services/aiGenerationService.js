const {
    BRAND_BLOCK
} = require("../config/branding");

const prisma = require("../database/prisma");
const promptRepository = require("../repositories/promptRepository");
const aiClient = require("./aiClient");
const AppError = require("../errors/AppError");

function parseMetadata(value) {
    if (!value) return {};

    if (typeof value === "object") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

function promptKeyFor(type) {
    const normalized = String(type || "").toUpperCase();

    return normalized === "PROFILE"
        ? "PROFILE_SUMMARY"
        : normalized;
}

const SOCIAL_FOOTER = `Need help or want to contact IndiaNikah?

WhatsApp:
http://wa.me/918482833177

Email:
contact@indianikah.com

${BRAND_BLOCK}`;

function appendFooter(content) {
    const text = String(content || "").trim();

    if (
        text.includes("http://wa.me/918482833177") &&
        text.includes("contact@indianikah.com")
    ) {
        return text;
    }

    return `${text}\n\n${SOCIAL_FOOTER}`;
}

async function generateForSource(
    sourceId,
    { replaceExisting = false } = {}
) {
    const source = await prisma.contentSource.findUnique({
        where: {
            id: Number(sourceId)
        },
        include: {
            posts: {
                orderBy: {
                    createdAt: "desc"
                },
                take: 1
            }
        }
    });

    if (!source) {
        throw new AppError("Content source not found", 404);
    }

    const existingPost = source.posts?.[0] || null;
    const promptKey = promptKeyFor(source.type);

    const [system, typePrompt] = await Promise.all([
        promptRepository.findByKey("GLOBAL_SYSTEM"),
        promptRepository.findByKey(promptKey)
    ]);

    if (!system) {
        throw new AppError(
            "GLOBAL_SYSTEM prompt is not configured",
            400
        );
    }

    if (!typePrompt) {
        throw new AppError(
            `No prompt configured for ${source.type}`,
            400
        );
    }

    const metadata = parseMetadata(source.metadata);

    if (source.type === "BOOK") {
        delete metadata.pdfUrl;
        delete metadata.coverUrl;
    }

    const input = JSON.stringify(
        {
            type: source.type,
            title: source.title,
            sourceUrl:
                source.type === "BOOK"
                    ? "https://www.indianikah.com/book/"
                    : source.sourceUrl,
            rawContent: source.rawContent,
            metadata
        },
        null,
        2
    );

    try {
        const result = await aiClient.generateJson({
            systemPrompt: system.content,
            userPrompt:
                `${typePrompt.content}\n\nSOURCE DATA:\n${input}`
        });

        let post;

        if (existingPost) {
            if (!replaceExisting) {
                throw new AppError(
                    "A post already exists for this source. Use regenerate.",
                    409
                );
            }

            if (existingPost.status === "APPROVED") {
                throw new AppError(
                    "Approved posts cannot be regenerated. Move it back to DRAFT first.",
                    409
                );
            }

            post = await prisma.post.update({
                where: {
                    id: existingPost.id
                },
                data: {
                    title: result.title,
                    content: appendFooter(result.content),
                    status: "DRAFT"
                }
            });
        } else {
            post = await prisma.$transaction(async (tx) => {
                const created = await tx.post.create({
                    data: {
                        title: result.title,
                        content: appendFooter(result.content),
                        status: "DRAFT",
                        sourceId: source.id
                    }
                });

                await tx.contentSource.update({
                    where: {
                        id: source.id
                    },
                    data: {
                        status: "PROCESSED"
                    }
                });

                return created;
            });
        }

        await prisma.generationLog.create({
            data: {
                postId: post.id,
                sourceId: source.id,
                contentType: source.type,
                provider: "OPENAI",
                model: result.model,
                status: "SUCCESS",
                promptKey
            }
        });

        return {
            post,
            sourceId: source.id,
            promptKey,
            provider: "OPENAI",
            model: result.model
        };
    } catch (error) {
        await prisma.generationLog.create({
            data: {
                postId: existingPost?.id || null,
                sourceId: source.id,
                contentType: source.type,
                provider: "OPENAI",
                model: process.env.OPENAI_MODEL || null,
                status: "FAILED",
                promptKey,
                errorMessage: error.message
            }
        });

        throw error;
    }
}

async function regeneratePost(postId) {
    const post = await prisma.post.findUnique({
        where: {
            id: Number(postId)
        }
    });

    if (!post) {
        throw new AppError("Post not found", 404);
    }

    if (!post.sourceId) {
        throw new AppError(
            "Manual posts cannot be AI-regenerated because they have no source",
            409
        );
    }

    return generateForSource(post.sourceId, {
        replaceExisting: true
    });
}

async function listLogs(limit = 50) {
    return prisma.generationLog.findMany({
        orderBy: {
            createdAt: "desc"
        },
        take: Math.min(Number(limit) || 50, 100)
    });
}

module.exports = {
    generateForSource,
    regeneratePost,
    listLogs
};