const prisma = require("../database/prisma");

const sourceInclude = {
    post: {
        select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
        }
    }
};

async function create(data) {
    return prisma.contentSource.create({ data, include: sourceInclude });
}

async function findByExternalId(externalId) {
    if (!externalId) return null;
    return prisma.contentSource.findUnique({ where: { externalId }, include: sourceInclude });
}

async function findById(id) {
    return prisma.contentSource.findUnique({ where: { id }, include: sourceInclude });
}

async function findAll({ type, status, search, page, limit }) {
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
        where.OR = [
            { title: { contains: search } },
            { rawContent: { contains: search } },
            { externalId: { contains: search } }
        ];
    }

    const [items, total] = await prisma.$transaction([
        prisma.contentSource.findMany({
            where,
            include: sourceInclude,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit
        }),
        prisma.contentSource.count({ where })
    ]);

    return { items, total };
}

async function updateStatus(id, status) {
    return prisma.contentSource.update({
        where: { id },
        data: { status },
        include: sourceInclude
    });
}

async function createDraftPostFromSource(source, postData) {
    return prisma.$transaction(async (tx) => {
        const post = await tx.post.create({
            data: {
                title: postData.title,
                content: postData.content,
                status: "DRAFT",
                sourceId: source.id
            }
        });

        const updatedSource = await tx.contentSource.update({
            where: { id: source.id },
            data: { status: "PROCESSED" },
            include: sourceInclude
        });

        return { post, source: updatedSource };
    });
}

module.exports = {
    create,
    findByExternalId,
    findById,
    findAll,
    updateStatus,
    createDraftPostFromSource
};
