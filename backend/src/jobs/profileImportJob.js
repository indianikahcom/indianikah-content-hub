const cron = require("node-cron");
const profileImportService = require("../services/profileImportService");
const logger = require("../logger/logger");

function startProfileImportJob() {
    if (String(process.env.PROFILE_IMPORT_CRON_ENABLED).toLowerCase() !== "true") {
        logger.info("Production profile import scheduler is disabled");
        return;
    }

    const expression = process.env.PROFILE_IMPORT_CRON || "0 8 * * *";
    const batchSize = Number(process.env.PROFILE_IMPORT_BATCH_SIZE || 250);
    const maxBatches = Number(process.env.PROFILE_IMPORT_MAX_BATCHES || 20);

    cron.schedule(expression, async () => {
        try {
            logger.info("Starting scheduled cursor-based production profile import");
            const result = await profileImportService.importProfiles({ mode: "CURSOR", batchSize, maxBatches, generateSummary: false });
            logger.info(`Scheduled profile import completed: ${result.run.importedCount} imported, ${result.run.skippedCount} skipped, cursor ${result.cursor.lastProcessedId}`);
        } catch (error) {
            logger.error(`Scheduled profile import failed: ${error.stack || error.message}`);
        }
    }, { timezone: "Asia/Kolkata", noOverlap: true });

    logger.info(`Production profile import scheduled with cron "${expression}" in Asia/Kolkata`);
}

module.exports = { startProfileImportJob };
