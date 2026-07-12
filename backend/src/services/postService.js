const postRepository = require("../repositories/postRepository");
const { createPostSchema } = require("../validators/postValidator");

async function createPost(postData) {
    const validatedPost = createPostSchema.parse(postData);

    return postRepository.createPost(validatedPost);
}

async function getAllPosts() {
    return postRepository.getAllPosts();
}

module.exports = {
    createPost,
    getAllPosts
};