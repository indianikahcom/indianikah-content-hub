const logger = require("../logger/logger");
const AppError = require("../errors/AppError");
const postService = require("./postService");
const telegramPublisher = require("./telegramPublisher");
const publicationRepository = require(
    "../repositories/publicationRepository"
);
const {
    getAutomationConfig,
} = require("../config/automationConfig");
const {
    sendPublishingReport,
} = require("./microsoftEmailService");

const TELEGRAM = "TELEGRAM";

function serializePublication(publication) {
    if (!publication) {
        return publication;
    }

    return {
        ...publication,
        responseData: publication.responseData
            ? (() => {
                try {
                    return JSON.parse(publication.responseData);
                } catch {
                    return publication.responseData;
                }
            })()
            : null,
    };
}

function normalizeChannelUsername(channelUsername) {
    if (!channelUsername) {
        return null;
    }

    return String(channelUsername)
        .trim()
        .replace(/^@/, "");
}

function createTelegramLiveUrl(channelUsername, messageId) {
    const username = normalizeChannelUsername(channelUsername);

    if (!username || !messageId) {
        return null;
    }

    return `https://t.me/${username}/${messageId}`;
}

/**
 * Email reporting is deliberately separated from platform publishing.
 *
 * A mail failure must never change a successful social-media publication
 * into a failed publication.
 */
async function sendReportSafely(report) {
    const config = getAutomationConfig();

    if (!config.emailReportEnabled) {
        logger.warn(
            "Publishing report email is disabled by configuration",
            {
                postId: report.postId,
                overallStatus: report.overallStatus,
            }
        );

        return {
            status: "SKIPPED",
            reason: "Publishing report email is disabled",
        };
    }

    try {
        await sendPublishingReport(report);

        logger.info("Publishing report email sent", {
            postId: report.postId,
            overallStatus: report.overallStatus,
        });

        return {
            status: "SENT",
        };
    } catch (error) {
        logger.error(
            `Publishing report email failed: ${error.message}`,
            {
                postId: report.postId,
                overallStatus: report.overallStatus,
                error: error.stack || error.message,
            }
        );

        return {
            status: "FAILED",
            errorMessage: error.message,
        };
    }
}

function createPublishingReport({
                                    post,
                                    platform,
                                    resultStatus,
                                    externalId = null,
                                    liveUrl = null,
                                    errorMessage = null,
                                    startedAt,
                                    completedAt,
                                }) {
    const success = resultStatus === "PUBLISHED";

    return {
        postId: post.id,
        title: post.title,
        content: post.content,

        overallStatus: success ? "SUCCESS" : "FAILED",

        /*
         * This Telegram-only legacy route does not move the Post itself
         * to PUBLISHED because the same Post may later be published to
         * additional platforms.
         */
        postStatus: post.status,

        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt - startedAt,

        results: [
            {
                platform,
                status: resultStatus,
                externalId,
                liveUrl,
                errorMessage,
                retryCount: 0,
                startedAt: startedAt.toISOString(),
                completedAt: completedAt.toISOString(),
            },
        ],
    };
}

async function publishPostToTelegram(postId) {
    const post = await postService.getPostById(postId);

    if (post.status !== "APPROVED") {
        throw new AppError(
            "Only APPROVED posts can be published",
            409,
            {
                currentStatus: post.status,
            }
        );
    }

    const destination =
        process.env.TELEGRAM_CHANNEL_ID || null;

    let publication =
        await publicationRepository.findByPostAndPlatform(
            postId,
            TELEGRAM
        );

    if (publication?.status === "SUCCESS") {
        throw new AppError(
            "This post has already been published to Telegram",
            409,
            {
                publicationId: publication.id,
                externalMessageId:
                publication.externalMessageId,
                publishedAt: publication.publishedAt,
            }
        );
    }

    publication = publication
        ? await publicationRepository.resetToPending(
            publication.id
        )
        : await publicationRepository.createPending(
            postId,
            TELEGRAM,
            destination
        );

    const startedAt = new Date();

    try {
        const result =
            await telegramPublisher.publishTextPost(post);

        const completedAt = new Date();

        const liveUrl = createTelegramLiveUrl(
            result.channelUsername,
            result.messageId
        );

        const saved =
            await publicationRepository.markSuccess(
                publication.id,
                {
                    externalMessageId: result.messageId,
                    responseData: {
                        chatId: result.chatId,
                        channelUsername:
                        result.channelUsername,
                        liveUrl,
                    },
                }
            );

        const report = createPublishingReport({
            post,
            platform: TELEGRAM,
            resultStatus: "PUBLISHED",
            externalId: result.messageId
                ? String(result.messageId)
                : null,
            liveUrl,
            startedAt,
            completedAt,
        });

        const emailReport =
            await sendReportSafely(report);

        return {
            ...serializePublication(saved),
            liveUrl,
            emailReport,
        };
    } catch (error) {
        const completedAt = new Date();
        const message =
            error?.message ||
            "Unknown Telegram publishing error";

        const failed =
            await publicationRepository.markFailed(
                publication.id,
                message,
                error.details || null
            );

        const report = createPublishingReport({
            post,
            platform: TELEGRAM,
            resultStatus: "FAILED",
            errorMessage: message,
            startedAt,
            completedAt,
        });

        const emailReport =
            await sendReportSafely(report);

        if (error instanceof AppError) {
            error.details = {
                ...(error.details || {}),
                publication:
                    serializePublication(failed),
                emailReport,
            };

            throw error;
        }

        throw new AppError(
            "Telegram publishing failed",
            502,
            {
                publication:
                    serializePublication(failed),
                emailReport,
                originalError: message,
            }
        );
    }
}

async function getPostPublications(postId) {
    await postService.getPostById(postId);

    const publications =
        await publicationRepository.findByPostId(postId);

    return publications.map(serializePublication);
}

module.exports = {
    publishPostToTelegram,
    getPostPublications,
};