require("dotenv").config();

const prisma = require("../src/database/prisma");

async function clearOldContent() {
    const databaseUrl = String(process.env.DATABASE_URL || "");

    if (!databaseUrl.startsWith("file:")) {
        throw new Error(
            `Safety check failed. Cleanup is allowed only for SQLite. Current DATABASE_URL: ${databaseUrl}`
        );
    }

    console.log("Database safety check passed:", databaseUrl);
    console.log("Starting Content Hub cleanup...");

    const result = await prisma.$transaction(async (tx) => {
        const campaignPublications =
            await tx.campaignPublication.deleteMany();

        const campaigns =
            await tx.publishCampaign.deleteMany();

        const publications =
            await tx.publication.deleteMany();

        const queueItems =
            await tx.contentQueueItem.deleteMany();

        const variants =
            await tx.postVariant.deleteMany();

        const generationLogs =
            await tx.generationLog.deleteMany();

        const posts =
            await tx.post.deleteMany();

        const resetSources =
            await tx.contentSource.updateMany({
                data: {
                    status: "NEW"
                }
            });

        const importRuns =
            await tx.importRun.deleteMany();

        return {
            campaignPublications: campaignPublications.count,
            campaigns: campaigns.count,
            publications: publications.count,
            queueItems: queueItems.count,
            variants: variants.count,
            generationLogs: generationLogs.count,
            posts: posts.count,
            resetSources: resetSources.count,
            importRuns: importRuns.count
        };
    });

    console.log("Cleanup completed successfully.");
    console.table(result);
}

clearOldContent()
    .catch((error) => {
        console.error("Cleanup failed:");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });