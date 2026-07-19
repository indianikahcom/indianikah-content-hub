const prisma = require("../database/prisma");

async function upsertVariant(postId, platform, data) {
    const now = new Date();

    return prisma.postVariant.upsert({
        where: {
            postId_platform: { postId, platform }
        },
        update: {
            title: data.title ?? null,
            content: data.content,
            updatedAt: now
        },
        create: {
            postId,
            platform,
            title: data.title ?? null,
            content: data.content,
            updatedAt: now
        }
    });
}

async function findByPostId(postId) {
    return prisma.postVariant.findMany({
        where: { postId },
        orderBy: { platform: "asc" }
    });
}

async function findById(id) {
    return prisma.postVariant.findUnique({
        where: { id }
    });
}

async function findPostWithSource(postId) {
    return prisma.post.findUnique({
        where: { id: postId },
        include: {
            source: true,
            variants: true
        }
    });
}

async function updateVariant(id, data) {
    return prisma.postVariant.update({
        where: { id },
        data: {
            ...data,
            updatedAt: new Date()
        }
    });
}

module.exports = {
    upsertVariant,
    findByPostId,
    findById,
    findPostWithSource,
    updateVariant
};
