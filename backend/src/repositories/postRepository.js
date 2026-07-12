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

module.exports = {
    createPost,
    getAllPosts
};