const logger = require("../logger/logger");
const AppError = require("../errors/AppError");
const repository = require("../repositories/publishingRepository");
const { getPublisher } = require("./publisherRegistry");
const {
    getAutomationConfig,
} = require("../config/automationConfig");
const {
    sendPublishingReport,
} = require("./microsoftEmailService");

function errorMessage(error) {
    return (
        error?.responseData?.error?.message ||
        error?.responseData?.message ||
        error?.message ||
        "Unknown publishing error"
    );
}

function overallStatus(results) {
    if (results.every((result) => result.status === "PUBLISHED")) {
        return "SUCCESS";
    }
    if (results.every((result) => result.status === "FAILED")) {
        return "FAILED";
    }
    return "PARTIAL_SUCCESS";
}

async function publishVariant(variant, options = {}) {
    const platform = String(variant.platform).toUpperCase();
    const publisher = getPublisher(platform);
    const startedAt = new Date();

    await repository.updateVariant(variant.id, {
        status: "PUBLISHING",
        errorMessage: null,
        updatedAt: new Date(),
    });

    try {
        const result = await publisher.publish({
            platform,
            title: variant.title,
            content: variant.content,
            imageUrl: options.imageUrl,
        });

        const publishedAt = new Date();

        await repository.updateVariant(variant.id, {
            status: "PUBLISHED",
            publishedAt,
            externalId: result.externalId || null,
            errorMessage: null,
            updatedAt: publishedAt,
        });

        await repository.createPublicationSafely({
            postId: Number(variant.postId),
            platform,
            status: "PUBLISHED",
            externalId: result.externalId || null,
            publishedAt,
            metadata: JSON.stringify({
                liveUrl: result.liveUrl || null,
                durationMs: publishedAt - startedAt,
            }),
        });

        return {
            variantId: variant.id,
            platform,
            status: "PUBLISHED",
            externalId: result.externalId || null,
            liveUrl: result.liveUrl || null,
            errorMessage: null,
            retryCount: options.retryCount || 0,
            startedAt: startedAt.toISOString(),
            completedAt: publishedAt.toISOString(),
        };
    } catch (error) {
        const completedAt = new Date();
        const message = errorMessage(error);

        await repository.updateVariant(variant.id, {
            status: "FAILED",
            errorMessage: message.slice(0, 2000),
            updatedAt: completedAt,
        });

        await repository.createPublicationSafely({
            postId: Number(variant.postId),
            platform,
            status: "FAILED",
            errorMessage: message.slice(0, 2000),
            metadata: JSON.stringify({
                durationMs: completedAt - startedAt,
                retryCount: options.retryCount || 0,
            }),
        });

        return {
            variantId: variant.id,
            platform,
            status: "FAILED",
            externalId: null,
            liveUrl: null,
            errorMessage: message,
            retryCount: options.retryCount || 0,
            startedAt: startedAt.toISOString(),
            completedAt: completedAt.toISOString(),
        };
    }
}

async function publishPost(postId, options = {}) {
    const config = getAutomationConfig();
    const post = await repository.findPostForPublishing(postId);

    if (!post) {
        throw new AppError("Post not found", 404);
    }

    if (
        post.status !== "APPROVED" &&
        options.force !== true
    ) {
        throw new AppError(
            "Only APPROVED posts can be published",
            409
        );
    }

    const enabledPlatforms = new Set(
        options.platforms?.map((value) =>
            String(value).toUpperCase()
        ) || config.enabledPlatforms
    );

    const variants = (post.variants || []).filter((variant) =>
        enabledPlatforms.has(
            String(variant.platform).toUpperCase()
        )
    );

    if (!variants.length) {
        throw new AppError(
            "No enabled platform variants found for this post",
            409
        );
    }

    const startedAt = new Date();
    const results = [];

    await repository.updatePost(post.id, {
        status: "PUBLISHING",
        updatedAt: new Date(),
    });

    for (const variant of variants) {
        results.push(
            await publishVariant(variant, {
                imageUrl: options.imageUrl,
                retryCount: options.retryCount || 0,
            })
        );
    }

    const status = overallStatus(results);
    const finalPostStatus =
        status === "SUCCESS"
            ? "PUBLISHED"
            : status === "FAILED"
              ? "FAILED"
              : "PARTIALLY_PUBLISHED";

    await repository.updatePost(post.id, {
        status: finalPostStatus,
        updatedAt: new Date(),
    });

    const completedAt = new Date();
    const report = {
        postId: post.id,
        title: post.title,
        content: post.content,
        overallStatus: status,
        postStatus: finalPostStatus,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt - startedAt,
        results,
    };

    if (
        config.emailReportEnabled &&
        options.sendEmail !== false
    ) {
        try {
            await sendPublishingReport(report);
            report.emailReport = {
                status: "SENT",
            };
        } catch (error) {
            logger.error(
                `Publishing report email failed: ${error.message}`
            );
            report.emailReport = {
                status: "FAILED",
                errorMessage: error.message,
            };
        }
    }

    return report;
}

async function retryFailed(postId, options = {}) {
    const post = await repository.findPostForPublishing(postId);

    if (!post) {
        throw new AppError("Post not found", 404);
    }

    const failedPlatforms = (post.variants || [])
        .filter((variant) => variant.status === "FAILED")
        .map((variant) => variant.platform);

    if (!failedPlatforms.length) {
        throw new AppError(
            "This post has no failed platform variants",
            409
        );
    }

    return publishPost(postId, {
        ...options,
        force: true,
        platforms: failedPlatforms,
        retryCount: Number(options.retryCount || 0) + 1,
    });
}

async function processApprovedQueue(options = {}) {
    const config = getAutomationConfig();

    if (!config.autoPublishEnabled && options.force !== true) {
        return {
            skipped: true,
            reason: "Automatic publishing is disabled",
            mode: config.mode,
        };
    }

    const posts = await repository.listReadyPosts(
        options.limit || config.maxAutoPostsPerDay
    );
    const results = [];

    for (const post of posts) {
        try {
            results.push(
                await publishPost(post.id, {
                    sendEmail: true,
                })
            );
        } catch (error) {
            results.push({
                postId: post.id,
                overallStatus: "FAILED",
                errorMessage: error.message,
            });
        }
    }

    return {
        skipped: false,
        processedCount: results.length,
        results,
    };
}

module.exports = {
    publishPost,
    retryFailed,
    processApprovedQueue,
};

