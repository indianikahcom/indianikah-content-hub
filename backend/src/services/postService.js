const postRepository = require("../repositories/postRepository");
const {
    createPostSchema,
    updatePostStatusSchema
} = require("../validators/postValidator");
const AppError = require("../errors/AppError");

const allowedStatusTransitions = {
    DRAFT: ["PENDING_APPROVAL"],
    PENDING_APPROVAL: ["DRAFT", "APPROVED"],
    APPROVED: ["DRAFT"]
};

async function createPost(postData) {
    const validatedPost = createPostSchema.parse(postData);

    return postRepository.createPost(validatedPost);
}

async function getAllPosts() {
    return postRepository.getAllPosts();
}

async function updatePostStatus(postId, requestData) {
    const validatedData = updatePostStatusSchema.parse(requestData);

    const post = await postRepository.getPostById(postId);

    if (!post) {
        throw new AppError("Post not found", 404);
    }

    const allowedStatuses = allowedStatusTransitions[post.status] || [];

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
    updatePostStatus
};