const prisma = require("../database/prisma");

async function findByPostAndPlatform(postId, platform) {
    return prisma.publication.findUnique({
        where: {
            postId_platform: {
                postId,
                platform
            }
        }
    });
}

async function createPending(postId, platform, destination) {
    return prisma.publication.create({
        data: {
            postId,
            platform,
            destination,
            status: "PENDING"
        }
    });
}

async function resetToPending(id) {
    return prisma.publication.update({
        where: { id },
        data: {
            status: "PENDING",
            externalMessageId: null,
            publishedAt: null,
            errorMessage: null,
            responseData: null
        }
    });
}

async function markSuccess(id, { externalMessageId, responseData }) {
    return prisma.publication.update({
        where: { id },
        data: {
            status: "SUCCESS",
            externalMessageId: String(externalMessageId),
            publishedAt: new Date(),
            errorMessage: null,
            responseData: responseData ? JSON.stringify(responseData) : null
        }
    });
}

async function markFailed(id, errorMessage, responseData = null) {
    return prisma.publication.update({
        where: { id },
        data: {
            status: "FAILED",
            errorMessage,
            responseData: responseData ? JSON.stringify(responseData) : null
        }
    });
}

async function findByPostId(postId) {
    return prisma.publication.findMany({
        where: { postId },
        orderBy: { createdAt: "desc" }
    });
}

module.exports = {
    findByPostAndPlatform,
    createPending,
    resetToPending,
    markSuccess,
    markFailed,
    findByPostId
};
