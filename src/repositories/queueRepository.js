const prisma = require("../database/prisma");

async function create(data) {
    return prisma.contentQueueItem.create({
        data,
        include: {
            post: {
                include: {
                    source: true,
                    campaigns: {
                        include: { publications: true },
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
        },
    });
}

async function findActiveByPostId(postId) {
    return prisma.contentQueueItem.findFirst({
        where: {
            postId: Number(postId),
            status: { in: ["READY", "APPROVED", "PUBLISHING"] },
        },
        orderBy: { createdAt: "desc" },
    });
}

async function findLatestByPostId(postId) {
    return prisma.contentQueueItem.findFirst({
        where: {
            postId: Number(postId),
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

async function findById(id) {
    return prisma.contentQueueItem.findUnique({
        where: { id: Number(id) },
        include: {
            post: {
                include: {
                    source: true,
                    campaigns: {
                        include: { publications: true },
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
        },
    });
}

async function list({ status, contentType, limit = 50 } = {}) {
    return prisma.contentQueueItem.findMany({
        where: {
            ...(status ? { status: String(status).toUpperCase() } : {}),
            ...(contentType
                ? { contentType: String(contentType).toUpperCase() }
                : {}),
        },
        include: {
            post: {
                include: {
                    source: true,
                    campaigns: {
                        include: { publications: true },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
            },
        },
        orderBy: [
            { priority: "asc" },
            { scheduledAt: "asc" },
            { createdAt: "asc" },
        ],
        take: Math.min(Number(limit) || 50, 100),
    });
}

async function update(id, data) {
    return prisma.contentQueueItem.update({
        where: { id: Number(id) },
        data,
        include: {
            post: {
                include: {
                    source: true,
                    campaigns: {
                        include: { publications: true },
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
        },
    });
}

async function countActive() {
    return prisma.contentQueueItem.count({
        where: {
            status: { in: ["READY", "APPROVED", "PUBLISHING"] },
        },
    });
}

async function findDueApproved(limit = 10) {
    const now = new Date();

    return prisma.contentQueueItem.findMany({
        where: {
            status: "APPROVED",
            OR: [
                { scheduledAt: null },
                { scheduledAt: { lte: now } },
            ],
        },
        include: {
            post: true,
        },
        orderBy: [
            { priority: "asc" },
            { scheduledAt: "asc" },
            { createdAt: "asc" },
        ],
        take: Math.min(Number(limit) || 10, 25),
    });
}

module.exports = {
    create,
    findActiveByPostId,
    findLatestByPostId,
    findById,
    list,
    update,
    countActive,
    findDueApproved,
};
