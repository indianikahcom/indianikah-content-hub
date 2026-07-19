const prisma = require("../database/prisma");

const postIncludes = {
    publications: {
        orderBy: { createdAt: "desc" }
    },
    variants: {
        orderBy: { createdAt: "asc" }
    },
    source: true
};

async function createPost(postData) {
    return prisma.post.create({
        data: postData
    });
}

async function getAllPosts(status) {
    return prisma.post.findMany({
        where: status ? { status } : undefined,
        include: postIncludes,
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
        include: postIncludes
    });
}

async function updatePost(postId, postData) {
    return prisma.post.update({
        where: {
            id: postId
        },
        data: postData,
        include: postIncludes
    });
}

async function updatePostStatus(postId, status) {
    return prisma.post.update({
        where: {
            id: postId
        },
        data: {
            status
        },
        include: postIncludes
    });
}

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    updatePostStatus
};
