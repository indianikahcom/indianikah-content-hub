const prisma = require("../database/prisma");

function getIstDayRange() {
    const now = new Date();

    const istParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);

    const values = Object.fromEntries(
        istParts
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value])
    );

    const start = new Date(
        `${values.year}-${values.month}-${values.day}T00:00:00+05:30`
    );

    const end = new Date(
        start.getTime() + 24 * 60 * 60 * 1000
    );

    return { start, end };
}

async function getSummary() {
    const { start: todayStart, end: todayEnd } =
        getIstDayRange();

    const [
        totalSources,
        newSources,
        processedSources,
        draftPosts,
        pendingApprovalPosts,
        approvedPosts,
        queueReady,
        queueApproved,
        queuePublishedToday,
        queueFailed,
        campaignsToday,
        successfulCampaignsToday,
        failedCampaignsToday,
        recentQueue,
        recentCampaigns,
    ] = await Promise.all([
        prisma.contentSource.count(),
        prisma.contentSource.count({ where: { status: "NEW" } }),
        prisma.contentSource.count({ where: { status: "PROCESSED" } }),
        prisma.post.count({ where: { status: "DRAFT" } }),
        prisma.post.count({
            where: { status: "PENDING_APPROVAL" },
        }),
        prisma.post.count({ where: { status: "APPROVED" } }),
        prisma.contentQueueItem.count({
            where: { status: "READY" },
        }),
        prisma.contentQueueItem.count({
            where: { status: "APPROVED" },
        }),
        prisma.contentQueueItem.count({
            where: {
                status: "PUBLISHED",
                publishedAt: {
                    gte: todayStart,
                    lt: todayEnd,
                },
            },
        }),
        prisma.contentQueueItem.count({
            where: {
                status: {
                    in: ["FAILED", "PARTIAL_SUCCESS"],
                },
            },
        }),
        prisma.publishCampaign.count({
            where: {
                createdAt: {
                    gte: todayStart,
                    lt: todayEnd,
                },
            },
        }),
        prisma.publishCampaign.count({
            where: {
                createdAt: {
                    gte: todayStart,
                    lt: todayEnd,
                },
                status: "SUCCESS",
            },
        }),
        prisma.publishCampaign.count({
            where: {
                createdAt: {
                    gte: todayStart,
                    lt: todayEnd,
                },
                status: {
                    in: ["FAILED", "PARTIAL_SUCCESS"],
                },
            },
        }),
        prisma.contentQueueItem.findMany({
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
            take: 8,
        }),
        prisma.publishCampaign.findMany({
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                publications: {
                    orderBy: { platform: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 8,
        }),
    ]);

    const platformRows =
        await prisma.campaignPublication.groupBy({
            by: ["platform", "status"],
            _count: { _all: true },
        });

    const platformStats = {};

    for (const row of platformRows) {
        if (!platformStats[row.platform]) {
            platformStats[row.platform] = {
                platform: row.platform,
                success: 0,
                failed: 0,
                pending: 0,
                total: 0,
            };
        }

        const item = platformStats[row.platform];
        item.total += row._count._all;

        if (row.status === "SUCCESS") {
            item.success += row._count._all;
        } else if (row.status === "FAILED") {
            item.failed += row._count._all;
        } else {
            item.pending += row._count._all;
        }
    }

    return {
        sources: {
            total: totalSources,
            new: newSources,
            processed: processedSources,
        },
        posts: {
            draft: draftPosts,
            pendingApproval: pendingApprovalPosts,
            approved: approvedPosts,
        },
        queue: {
            ready: queueReady,
            approved: queueApproved,
            publishedToday: queuePublishedToday,
            failed: queueFailed,
        },
        campaigns: {
            today: campaignsToday,
            successfulToday: successfulCampaignsToday,
            failedToday: failedCampaignsToday,
        },
        platformStats: Object.values(platformStats),
        recentQueue,
        recentCampaigns,
        generatedAt: new Date(),
    };
}

module.exports = { getSummary };
