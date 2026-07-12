const prisma = require("../database/prisma");

async function createPost(postData) {
    return prisma.post.create({
        data: postData
    });
}

async function getAllPosts() {
    return prisma.post.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });
}

async function getPostById(postId) {
    return prisma.post.findUnique({
        where: {
            id: postId
        }
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
    updatePostStatus
};