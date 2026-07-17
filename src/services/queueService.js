const queueRepository = require("../repositories/queueRepository");
const randomDraftService = require("./randomDraftService");
const postService = require("./postService");
const campaignService = require("./campaignService");
const AppError = require("../errors/AppError");

function parseMetadata(value) {
    if (!value || typeof value === "object") return value;
    try { return JSON.parse(value); } catch { return value; }
}

function serialize(item) {
    if (!item) return item;

    return {
        ...item,
        metadata: parseMetadata(item.metadata),
        post: item.post
            ? {
                  ...item.post,
                  source: item.post.source
                      ? {
                            ...item.post.source,
                            metadata: parseMetadata(item.post.source.metadata),
                        }
                      : null,
              }
            : null,
    };
}

async function addRandom({
    type,
    platform = "ALL",
    scheduledAt = null,
    priority = 100,
}) {
    const result = await randomDraftService.createRandomDraft({
        type,
        platform: platform === "ALL" ? "TELEGRAM" : platform,
    });

    const existing = await queueRepository.findActiveByPostId(
        result.post.id
    );

    if (existing) {
        return {
            queueItem: serialize(existing),
            selectedSource: result.selectedSource,
            created: false,
        };
    }

    const queueItem = await queueRepository.create({
        postId: result.post.id,
        contentType: String(type).toUpperCase(),
        platform: String(platform).toUpperCase(),
        status:
            result.post.status === "APPROVED"
                ? "APPROVED"
                : "READY",
        priority: Number(priority) || 100,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        metadata: JSON.stringify({
            generated: result.generated,
            reusedExistingPost: result.reusedExistingPost,
            selectedSourceId: result.selectedSource.id,
        }),
    });

    return {
        queueItem: serialize(queueItem),
        selectedSource: result.selectedSource,
        created: true,
    };
}

async function list(filters) {
    const rows = await queueRepository.list(filters);
    return rows.map(serialize);
}

async function getById(id) {
    const item = await queueRepository.findById(id);
    if (!item) throw new AppError("Queue item not found", 404);
    return serialize(item);
}

async function approve(id) {
    const item = await getById(id);

    if (!["READY", "APPROVED"].includes(item.status)) {
        throw new AppError(
            `Queue item cannot be approved from ${item.status}`,
            409
        );
    }

    let post = item.post;

    if (post.status === "DRAFT") {
        post = await postService.updatePostStatus(post.id, {
            status: "PENDING_APPROVAL",
        });
    }

    if (post.status === "PENDING_APPROVAL") {
        post = await postService.updatePostStatus(post.id, {
            status: "APPROVED",
        });
    }

    if (post.status !== "APPROVED") {
        throw new AppError(
            `Post could not be approved from ${post.status}`,
            409
        );
    }

    return serialize(
        await queueRepository.update(item.id, {
            status: "APPROVED",
            approvedAt: new Date(),
            errorMessage: null,
        })
    );
}

async function publish(id) {
    let item = await getById(id);

    if (item.status === "READY") {
        item = await approve(id);
    }

    if (item.status !== "APPROVED") {
        throw new AppError(
            `Queue item cannot be published from ${item.status}`,
            409
        );
    }

    await queueRepository.update(item.id, {
        status: "PUBLISHING",
        attempts: { increment: 1 },
        errorMessage: null,
    });

    try {
        const campaign = await campaignService.publish(
            item.postId,
            item.platform || "ALL"
        );

        const finalStatus =
            campaign.status === "FAILED"
                ? "FAILED"
                : campaign.status === "PARTIAL_SUCCESS"
                    ? "PARTIAL_SUCCESS"
                    : "PUBLISHED";

        return serialize(
            await queueRepository.update(item.id, {
                status: finalStatus,
                publishedAt:
                    finalStatus === "PUBLISHED"
                        ? new Date()
                        : null,
                publishedCampaignId: campaign.id,
                errorMessage:
                    finalStatus === "FAILED"
                        ? "All configured platforms failed"
                        : null,
            })
        );
    } catch (error) {
        await queueRepository.update(item.id, {
            status: "FAILED",
            errorMessage: error.message,
        });
        throw error;
    }
}

async function remove(id) {
    const item = await getById(id);

    if (item.status === "PUBLISHING") {
        throw new AppError(
            "Publishing queue items cannot be cancelled",
            409
        );
    }

    return serialize(
        await queueRepository.update(item.id, {
            status: "CANCELLED",
        })
    );
}

module.exports = {
    addRandom,
    list,
    getById,
    approve,
    publish,
    remove,
};
