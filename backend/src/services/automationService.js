const prisma = require("../database/prisma");
const AppError = require("../errors/AppError");
const {
    MODES,
    getAutomationConfig,
} = require("../config/automationConfig");
const publishingService = require("./publishingService");

async function getStatus() {
    const config = getAutomationConfig();

    return {
        ...config,
        safety: {
            manualApprovalIsDefault:
                config.mode === MODES.MANUAL_APPROVAL,
            fullAutoRequiresModeAndTwoFlags:
                config.mode === MODES.FULL_AUTO &&
                config.autoApproveEnabled &&
                config.autoPublishEnabled,
        },
    };
}

async function autoApprovePost(postId) {
    const config = getAutomationConfig();

    if (
        config.mode !== MODES.FULL_AUTO ||
        !config.autoApproveEnabled
    ) {
        throw new AppError(
            "Automatic approval is disabled",
            409
        );
    }

    const post = await prisma.post.findUnique({
        where: { id: Number(postId) },
    });

    if (!post) throw new AppError("Post not found", 404);

    if (
        !["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(
            post.status
        )
    ) {
        throw new AppError(
            `Post status ${post.status} cannot be automatically approved`,
            409
        );
    }

    if (post.status !== "APPROVED") {
        await prisma.post.update({
            where: { id: post.id },
            data: {
                status: "APPROVED",
                updatedAt: new Date(),
            },
        });

        await prisma.postVariant.updateMany({
            where: { postId: post.id },
            data: {
                status: "APPROVED",
                updatedAt: new Date(),
            },
        });
    }

    return publishingService.publishPost(post.id);
}

module.exports = {
    getStatus,
    autoApprovePost,
};
