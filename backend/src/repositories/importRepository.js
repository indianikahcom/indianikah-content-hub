const prisma = require("../database/prisma");

async function createRun(data) {
    return prisma.importRun.create({ data });
}

async function completeRun(id, data) {
    return prisma.importRun.update({
        where: { id },
        data: { ...data, completedAt: new Date() },
    });
}

async function updateRun(id, data) {
    return prisma.importRun.update({ where: { id }, data });
}

async function listRuns(limit = 20) {
    return prisma.importRun.findMany({
        orderBy: { startedAt: "desc" },
        take: limit,
    });
}

async function findLatestRun(importType) {
    return prisma.importRun.findFirst({
        where: { importType },
        orderBy: { startedAt: "desc" },
    });
}

async function findLatestSuccessfulRun(importType) {
    return prisma.importRun.findFirst({
        where: { importType, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
    });
}

async function findRunningRun(importType) {
    return prisma.importRun.findFirst({
        where: { importType, status: "RUNNING" },
        orderBy: { startedAt: "desc" },
    });
}

async function getImportOverview() {
    const [latest, running, totals] = await Promise.all([
        prisma.importRun.findFirst({ orderBy: { startedAt: "desc" } }),
        prisma.importRun.findMany({ where: { status: "RUNNING" }, orderBy: { startedAt: "desc" } }),
        prisma.importRun.groupBy({ by: ["status"], _count: { _all: true }, _sum: { importedCount: true, skippedCount: true, fetchedCount: true } }),
    ]);
    return { latest, running, totals };
}

module.exports = {
    createRun,
    completeRun,
    updateRun,
    listRuns,
    findLatestRun,
    findLatestSuccessfulRun,
    findRunningRun,
    getImportOverview,
};
