const cron = require("node-cron");
const profileImportService = require("../services/profileImportService");
const logger = require("../logger/logger");

function startProfileImportJob() {
    if (String(process.env.PROFILE_IMPORT_CRON_ENABLED).toLowerCase() !== "true") {
        logger.info("Daily production profile import scheduler is disabled");
        return;
    }

    const expression = process.env.PROFILE_IMPORT_CRON || "0 8 * * *";
    cron.schedule(expression, async () => {
        try {
            logger.info("Starting scheduled production profile import");
            const result = await profileImportService.importRecentProfiles({ hours: 24, generateSummary: true });
            logger.info(`Scheduled profile import completed: ${result.run.importedCount} imported, ${result.run.skippedCount} skipped`);
        } catch (error) {
            logger.error(`Scheduled profile import failed: ${error.stack || error.message}`);
        }
    }, { timezone: "Asia/Kolkata", noOverlap: true });

    logger.info(`Daily production profile import scheduled with cron "${expression}" in Asia/Kolkata`);
}

module.exports = { startProfileImportJob };
