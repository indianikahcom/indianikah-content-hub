const postService = require("../services/postService");

async function createPost(request, response) {
    const post = await postService.createPost(request.body);

    response.status(201).json(post);
}

async function getAllPosts(request, response) {
    const posts = await postService.getAllPosts();

    response.json(posts);
}

module.exports = {
    createPost,
    getAllPosts
};