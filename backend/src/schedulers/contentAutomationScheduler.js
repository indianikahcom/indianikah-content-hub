const cron = require("node-cron");
const logger = require("../logger/logger");
const {
    getAutomationConfig,
} = require("../config/automationConfig");
const publishingService = require("../services/publishingService");
const profileDailySummaryService = require("../services/profileDailySummaryService");
const automationService = require("../services/automationService");

let queueTask;
let summaryTask;

async function generateProfileSummaryAndMaybePublish() {
    const config = getAutomationConfig();

    try {
        const generated =
            await profileDailySummaryService.createDailySummary({
                hours: 24,
                topLimit: 5,
                fetchLimit: 5000,
                dryRun: false,
                replaceExisting: false,
                composePlatforms: true,
            });

        const postId = generated?.post?.id;

        if (
            postId &&
            config.autoApproveEnabled &&
            config.autoPublishEnabled
        ) {
            await automationService.autoApprovePost(postId);
        }
    } catch (error) {
        if (
            error.statusCode === 409 ||
            String(error.message).includes("already exists")
        ) {
            logger.info(
                "Daily profile summary already exists; scheduler skipped"
            );
            return;
        }

        logger.error(
            `Profile summary scheduler failed: ${error.stack || error.message}`
        );
    }
}

function startContentAutomationScheduler() {
    const config = getAutomationConfig();

    if (config.schedulerEnabled) {
        const expression = `*/${config.queueIntervalMinutes} * * * *`;

        queueTask = cron.schedule(expression, async () => {
            try {
                await publishingService.processApprovedQueue();
            } catch (error) {
                logger.error(
                    `Content queue scheduler failed: ${
                        error.stack || error.message
                    }`
                );
            }
        });

        logger.info(
            `Content queue scheduler enabled: every ${config.queueIntervalMinutes} minute(s)`
        );
    } else {
        logger.info("Content queue scheduler is disabled");
    }

    if (config.profileSummarySchedulerEnabled) {
        const expression = `${config.profileSummaryMinuteIst} ${config.profileSummaryHourIst} * * *`;

        summaryTask = cron.schedule(
            expression,
            generateProfileSummaryAndMaybePublish,
            {
                timezone: "Asia/Kolkata",
            }
        );

        logger.info(
            `Profile summary scheduler enabled at ${String(
                config.profileSummaryHourIst
            ).padStart(2, "0")}:${String(
                config.profileSummaryMinuteIst
            ).padStart(2, "0")} IST`
        );
    } else {
        logger.info("Profile summary scheduler is disabled");
    }
}

function stopContentAutomationScheduler() {
    queueTask?.stop();
    summaryTask?.stop();
}

module.exports = {
    startContentAutomationScheduler,
    stopContentAutomationScheduler,
    generateProfileSummaryAndMaybePublish,
};

