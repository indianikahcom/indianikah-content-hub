const AppError = require("../errors/AppError");
const postService = require("./postService");
const telegramPublisher = require("./telegramPublisher");
const publicationRepository = require("../repositories/publicationRepository");

const TELEGRAM = "TELEGRAM";

function serializePublication(publication) {
    if (!publication) return publication;

    return {
        ...publication,
        responseData: publication.responseData
            ? (() => {
                try { return JSON.parse(publication.responseData); }
                catch { return publication.responseData; }
            })()
            : null
    };
}

async function publishPostToTelegram(postId) {
    const post = await postService.getPostById(postId);

    if (post.status !== "APPROVED") {
        throw new AppError("Only APPROVED posts can be published", 409, {
            currentStatus: post.status
        });
    }

    const destination = process.env.TELEGRAM_CHANNEL_ID || null;
    let publication = await publicationRepository.findByPostAndPlatform(postId, TELEGRAM);

    if (publication?.status === "SUCCESS") {
        throw new AppError("This post has already been published to Telegram", 409, {
            publicationId: publication.id,
            externalMessageId: publication.externalMessageId,
            publishedAt: publication.publishedAt
        });
    }

    publication = publication
        ? await publicationRepository.resetToPending(publication.id)
        : await publicationRepository.createPending(postId, TELEGRAM, destination);

    try {
        const result = await telegramPublisher.publishTextPost(post);
        const saved = await publicationRepository.markSuccess(publication.id, {
            externalMessageId: result.messageId,
            responseData: {
                chatId: result.chatId,
                channelUsername: result.channelUsername
            }
        });

        return serializePublication(saved);
    } catch (error) {
        const failed = await publicationRepository.markFailed(
            publication.id,
            error.message,
            error.details || null
        );

        if (error instanceof AppError) {
            error.details = {
                ...(error.details || {}),
                publication: serializePublication(failed)
            };
            throw error;
        }

        throw new AppError("Telegram publishing failed", 502, {
            publication: serializePublication(failed)
        });
    }
}

async function getPostPublications(postId) {
    await postService.getPostById(postId);
    const publications = await publicationRepository.findByPostId(postId);
    return publications.map(serializePublication);
}

module.exports = {
    publishPostToTelegram,
    getPostPublications
};
