const postService = require("../services/postService");

async function createPost(request, response, next) {
    try {
        const post = await postService.createPost(request.body);

        response.status(201).json(post);
    } catch (error) {
        next(error);
    }
}

async function getAllPosts(request, response, next) {
    try {
        const posts = await postService.getAllPosts();

        response.json(posts);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createPost,
    getAllPosts
};