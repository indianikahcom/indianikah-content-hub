const postRepository = require("../repositories/postRepository");

const {
    createPostSchema,
    updatePostSchema,
    updatePostStatusSchema,
    postStatusFilterSchema
} = require("../validators/postValidator");

const AppError = require("../errors/AppError");

const allowedStatusTransitions = {
    DRAFT: [
        "PENDING_APPROVAL"
    ],

    PENDING_APPROVAL: [
        "DRAFT",
        "APPROVED"
    ],

    APPROVED: [
        "DRAFT"

    ]
};

async function createPost(postData) {
    const validatedPost = createPostSchema.parse(postData);

    return postRepository.createPost(validatedPost);
}

async function getAllPosts(status) {
    let validatedStatus;

    if (status) {
        validatedStatus = postStatusFilterSchema.parse(status);
    }

    return postRepository.getAllPosts(validatedStatus);
}

async function getPostById(postId) {
    const post = await postRepository.getPostById(postId);

    if (!post) {
        throw new AppError(
            "Post not found",
            404
        );
    }

    return post;
}

async function updatePost(postId, postData) {
    const validatedPost = updatePostSchema.parse(postData);

    const post = await getPostById(postId);

    if (post.status === "APPROVED") {
        throw new AppError(
            "Approved post cannot be edited. Move it back to DRAFT first.",
            409,
            {
                currentStatus: post.status
            }
        );
    }

    return postRepository.updatePost(
        postId,
        validatedPost
    );
}

async function updatePostStatus(postId, requestData) {
    const validatedData = updatePostStatusSchema.parse(requestData);

    const post = await getPostById(postId);

    const allowedStatuses =
        allowedStatusTransitions[post.status] || [];

    if (!allowedStatuses.includes(validatedData.status)) {
        throw new AppError(
            `Cannot change post status from ${post.status} to ${validatedData.status}`,
            409,
            {
                currentStatus: post.status,
                requestedStatus: validatedData.status,
                allowedStatuses
            }
        );
    }

    return postRepository.updatePostStatus(
        postId,
        validatedData.status
    );
}

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    updatePostStatus
};