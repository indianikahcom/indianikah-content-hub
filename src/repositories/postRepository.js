const prisma = require("../database/prisma");

async function createPost(postData) {
    return prisma.post.create({
        data: postData
    });
}

async function getAllPosts(status) {
    return prisma.post.findMany({
        where: status
            ? {
                status
            }
            : undefined,

        include: {
            publications: {
                orderBy: { createdAt: "desc" }
            }
        },

        orderBy: {
            createdAt: "desc"
        }
    });
}

async function getPostById(postId) {
    return prisma.post.findUnique({
        where: {
            id: postId
        },
        include: {
            publications: {
                orderBy: { createdAt: "desc" }
            }
        }
    });
}

async function updatePost(postId, postData) {
    return prisma.post.update({
        where: {
            id: postId
        },

        data: postData
    });
}

async function updatePostStatus(postId, status) {
    return prisma.post.update({
        where: {
            id: postId
        },

        data: {
            status
        }
    });
}

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    updatePostStatus
};