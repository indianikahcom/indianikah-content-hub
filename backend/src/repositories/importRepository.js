const prisma = require("../database/prisma");

async function createRun(data) {
    return prisma.importRun.create({ data });
}

async function completeRun(id, data) {
    return prisma.importRun.update({
        where: { id },
        data: { ...data, completedAt: new Date() }
    });
}

async function listRuns(limit = 20) {
    return prisma.importRun.findMany({
        orderBy: { startedAt: "desc" },
        take: limit
    });
}

module.exports = { createRun, completeRun, listRuns };
