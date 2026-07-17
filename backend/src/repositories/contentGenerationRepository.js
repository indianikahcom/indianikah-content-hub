const prisma = require("../database/prisma");

async function findNextUnusedSource(type) {
    return prisma.contentSource.findFirst({
        where: {
            type,
            status: "NEW",
            post: null
        },
        orderBy: [
            { createdAt: "asc" },
            { id: "asc" }
        ]
    });
}

async function countUnusedSources(type) {
    return prisma.contentSource.count({
        where: {
            type,
            status: "NEW",
            post: null
        }
    });
}

module.exports = {
    findNextUnusedSource,
    countUnusedSources
};
