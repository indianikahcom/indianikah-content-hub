const publicationService = require("../services/publicationService");

function parsePostId(request) {
    const postId = Number(request.params.id);
    return Number.isInteger(postId) && postId > 0 ? postId : null;
}

async function publishToTelegram(request, response, next) {
    try {
        const postId = parsePostId(request);
        if (!postId) {
            return response.status(400).json({ status: "ERROR", message: "Invalid post ID" });
        }

        const publication = await publicationService.publishPostToTelegram(postId);

        return response.status(201).json({
            success: true,
            message: "Post published to Telegram successfully",
            data: publication
        });
    } catch (error) {
        return next(error);
    }
}

async function getPostPublications(request, response, next) {
    try {
        const postId = parsePostId(request);
        if (!postId) {
            return response.status(400).json({ status: "ERROR", message: "Invalid post ID" });
        }

        const publications = await publicationService.getPostPublications(postId);

        return response.json({
            success: true,
            count: publications.length,
            data: publications
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    publishToTelegram,
    getPostPublications
};
