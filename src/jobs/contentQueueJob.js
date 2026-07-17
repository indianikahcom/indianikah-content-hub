const cron = require("node-cron");
const queueRepository = require("../repositories/queueRepository");
const queueService = require("../services/queueService");
const logger = require("../logger/logger");

const ROTATION_TYPES = ["BOOK", "GUIDELINE", "BLOG"];

async function fillQueue() {
    const target = Math.min(
        Math.max(
            Number.parseInt(
                process.env.QUEUE_TARGET_READY || "6",
                10
            ) || 6,
            1
        ),
        30
    );

    let active = await queueRepository.countActive();

    while (active < target) {
        const type =
            ROTATION_TYPES[active % ROTATION_TYPES.length];

        try {
            await queueService.addRandom({
                type,
                platform: "ALL",
                priority: 100 + active,
            });
            active += 1;
        } catch (error) {
            logger.warn(
                `Queue fill skipped ${type}: ${error.message}`
            );

            const remaining = ROTATION_TYPES.filter(
                (candidate) => candidate !== type
            );

            if (!remaining.length) break;
            active += 1;
        }
    }
}

async function publishDueItems() {
    if (
        String(process.env.QUEUE_AUTO_PUBLISH).toLowerCase() !==
        "true"
    ) {
        return;
    }

    const due = await queueRepository.findDueApproved(5);

    for (const item of due) {
        try {
            await queueService.publish(item.id);
            logger.info(
                `Queue item ${item.id} published successfully`
            );
        } catch (error) {
            logger.error(
                `Queue item ${item.id} failed: ${error.message}`
            );
        }
    }
}

async function runContentQueueCycle() {
    await fillQueue();
    await publishDueItems();
}

function startContentQueueJob() {
    if (
        String(process.env.CONTENT_QUEUE_CRON_ENABLED).toLowerCase() !==
        "true"
    ) {
        logger.info("Content queue scheduler is disabled");
        return;
    }

    const expression =
        process.env.CONTENT_QUEUE_CRON || "15 * * * *";

    cron.schedule(
        expression,
        async () => {
            try {
                logger.info("Starting content queue cycle");
                await runContentQueueCycle();
                logger.info("Content queue cycle completed");
            } catch (error) {
                logger.error(
                    `Content queue cycle failed: ${
                        error.stack || error.message
                    }`
                );
            }
        },
        {
            timezone: "Asia/Kolkata",
            noOverlap: true,
        }
    );

    logger.info(
        `Content queue scheduled with cron "${expression}" in Asia/Kolkata`
    );
}

module.exports = {
    startContentQueueJob,
    runContentQueueCycle,
};
