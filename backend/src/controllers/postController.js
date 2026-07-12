const postService = require("../services/postService");

async function createPost(request, response, next) {
    try {
        const post = await postService.createPost(request.body);

        return response.status(201).json(post);
    } catch (error) {
        return next(error);
    }
}

async function getAllPosts(request, response, next) {
    try {
        const posts = await postService.getAllPosts();

        return response.json(posts);
    } catch (error) {
        return next(error);
    }
}

async function updatePostStatus(request, response, next) {
    try {
        const postId = Number(request.params.id);

        if (!Number.isInteger(postId) || postId <= 0) {
            return response.status(400).json({
                status: "ERROR",
                message: "Invalid post ID"
            });
        }

        const post = await postService.updatePostStatus(
            postId,
            request.body
        );

        return response.json(post);
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createPost,
    getAllPosts,
    updatePostStatus
};