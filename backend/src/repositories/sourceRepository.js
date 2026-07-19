const prisma = require("../database/prisma");

const postsInclude = {
    posts: {
        select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
    },
};

function withLatestPost(source) {
    if (!source) return source;
    const posts = Array.isArray(source.posts) ? source.posts : [];
    return { ...source, posts, post: posts[0] || null };
}

async function create(data) {
    return withLatestPost(await prisma.contentSource.create({ data, include: postsInclude }));
}

async function findByExternalId(externalId) {
    if (!externalId) return null;
    return withLatestPost(await prisma.contentSource.findUnique({
        where: { externalId },
        include: postsInclude,
    }));
}

async function findExistingExternalIds(externalIds) {
    if (!Array.isArray(externalIds) || externalIds.length === 0) return new Set();
    const rows = await prisma.contentSource.findMany({
        where: { externalId: { in: externalIds } },
        select: { externalId: true },
    });
    return new Set(rows.map((row) => row.externalId));
}

async function createMany(data) {
    if (!Array.isArray(data) || data.length === 0) return { count: 0 };
    return prisma.contentSource.createMany({ data });
}

async function findById(id) {
    return withLatestPost(await prisma.contentSource.findUnique({
        where: { id: Number(id) },
        include: postsInclude,
    }));
}

async function findAll({ type, status, search, page, limit }) {
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
        where.OR = ["title", "rawContent", "externalId"].map((field) => ({
            [field]: { contains: search },
        }));
    }
    const [items, total] = await prisma.$transaction([
        prisma.contentSource.findMany({
            where,
            include: postsInclude,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.contentSource.count({ where }),
    ]);
    return { items: items.map(withLatestPost), total };
}

async function updateStatus(id, status) {
    return withLatestPost(await prisma.contentSource.update({
        where: { id: Number(id) },
        data: { status },
        include: postsInclude,
    }));
}

async function createDraftPostFromSource(source, postData) {
    return prisma.$transaction(async (tx) => {
        const post = await tx.post.create({
            data: {
                title: postData.title,
                content: postData.content,
                status: "DRAFT",
                sourceId: source.id,
            },
        });
        const updatedSource = await tx.contentSource.update({
            where: { id: source.id },
            data: { status: "PROCESSED" },
            include: postsInclude,
        });
        return { post, source: withLatestPost(updatedSource) };
    });
}

module.exports = {
    create,
    findByExternalId,
    findExistingExternalIds,
    createMany,
    findById,
    findAll,
    updateStatus,
    createDraftPostFromSource,
};
