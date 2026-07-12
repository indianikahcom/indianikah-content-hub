const postService = require("../services/postService");

function parsePostId(request) {
    const postId = Number(request.params.id);

    if (!Number.isInteger(postId) || postId <= 0) {
        return null;
    }

    return postId;
}

async function createPost(request, response, next) {
    try {
        const post = await postService.createPost(
            request.body
        );

        return response
            .status(201)
            .json(post);

    } catch (error) {
        return next(error);
    }
}

async function getAllPosts(request, response, next) {
    try {
        const posts = await postService.getAllPosts(
            request.query.status
        );

        return response.json(posts);

    } catch (error) {
        return next(error);
    }
}

async function getPostById(request, response, next) {
    try {
        const postId = parsePostId(request);

        if (!postId) {
            return response.status(400).json({
                status: "ERROR",
                message: "Invalid post ID"
            });
        }

        const post = await postService.getPostById(
            postId
        );

        return response.json(post);

    } catch (error) {
        return next(error);
    }
}

async function updatePost(request, response, next) {
    try {
        const postId = parsePostId(request);

        if (!postId) {
            return response.status(400).json({
                status: "ERROR",
                message: "Invalid post ID"
            });
        }

        const post = await postService.updatePost(
            postId,
            request.body
        );

        return response.json(post);

    } catch (error) {
        return next(error);
    }
}

async function updatePostStatus(request, response, next) {
    try {
        const postId = parsePostId(request);

        if (!postId) {
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
    getPostById,
    updatePost,
    updatePostStatus
};