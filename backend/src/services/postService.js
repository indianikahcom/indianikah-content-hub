const postRepository = require("../repositories/postRepository");

async function createPost(postData) {
    return postRepository.createPost(postData);
}

async function getAllPosts() {
    return postRepository.getAllPosts();
}

module.exports = {
    createPost,
    getAllPosts
};