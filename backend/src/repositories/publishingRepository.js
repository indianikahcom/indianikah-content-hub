const prisma = require("../database/prisma");

async function findPostForPublishing(postId) {
    return prisma.post.findUnique({
        where: { id: Number(postId) },
        include: {
            variants: {
                orderBy: { platform: "asc" },
            },
        },
    });
}

async function listReadyPosts(limit = 10) {
    return prisma.post.findMany({
        where: {
            status: "APPROVED",
        },
        include: {
            variants: {
                where: {
                    status: {
                        in: ["DRAFT", "APPROVED", "FAILED", "SCHEDULED"],
                    },
                },
                orderBy: { platform: "asc" },
            },
        },
        orderBy: { updatedAt: "asc" },
        take: Math.min(Math.max(Number(limit) || 10, 1), 100),
    });
}

async function updateVariant(variantId, data) {
    return prisma.postVariant.update({
        where: { id: Number(variantId) },
        data,
    });
}

async function updatePost(postId, data) {
    return prisma.post.update({
        where: { id: Number(postId) },
        data,
    });
}

async function createPublicationSafely(data) {
    if (!prisma.publication?.create) return null;

    try {
        return await prisma.publication.create({ data });
    } catch (error) {
        // Publication schemas may differ across earlier milestones.
        // PostVariant remains the authoritative per-platform state.
        return {
            skipped: true,
            reason: error.message,
        };
    }
}

module.exports = {
    findPostForPublishing,
    listReadyPosts,
    updateVariant,
    updatePost,
    createPublicationSafely,
};
