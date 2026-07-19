const publishingService = require("../services/publishingService");
const automationService = require("../services/automationService");

async function publishPost(req, res, next) {
    try {
        const data = await publishingService.publishPost(
            req.params.postId,
            req.body || {}
        );

        res.json({
            success: true,
            message: "Publishing attempt completed",
            data,
        });
    } catch (error) {
        next(error);
    }
}

async function retryFailed(req, res, next) {
    try {
        const data = await publishingService.retryFailed(
            req.params.postId,
            req.body || {}
        );

        res.json({
            success: true,
            message: "Failed platforms retried",
            data,
        });
    } catch (error) {
        next(error);
    }
}

async function processQueue(req, res, next) {
    try {
        const data =
            await publishingService.processApprovedQueue({
                ...(req.body || {}),
                force: true,
            });

        res.json({
            success: true,
            message: "Publishing queue processed",
            data,
        });
    } catch (error) {
        next(error);
    }
}

async function status(req, res, next) {
    try {
        res.json({
            success: true,
            data: await automationService.getStatus(),
        });
    } catch (error) {
        next(error);
    }
}

async function autoApproveAndPublish(req, res, next) {
    try {
        const data =
            await automationService.autoApprovePost(
                req.params.postId
            );

        res.json({
            success: true,
            message:
                "Post automatically approved and publishing completed",
            data,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    publishPost,
    retryFailed,
    processQueue,
    status,
    autoApproveAndPublish,
};
