const prisma = require("../database/prisma");

const buildWhere = (filters = {}) => {
  const where = {};
  for (const field of ["type", "status", "language", "category", "subcategory"]) {
    if (filters[field]) where[field] = filters[field];
  }
  if (filters.sourceId !== undefined) where.sourceId = Number(filters.sourceId);
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { content: { contains: filters.search } },
      { summary: { contains: filters.search } },
    ];
  }
  return where;
};

const create = (data) => prisma.knowledgeItem.create({ data });

const findById = (id) =>
  prisma.knowledgeItem.findUnique({ where: { id: Number(id) } });

const findDuplicate = ({ id, type, title, language }) =>
  prisma.knowledgeItem.findFirst({
    where: {
      type,
      title,
      language,
      ...(id ? { NOT: { id: Number(id) } } : {}),
    },
  });

const list = async (filters = {}) => {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const where = buildWhere(filters);

  const [items, total] = await prisma.$transaction([
    prisma.knowledgeItem.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.knowledgeItem.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const update = (id, data) =>
  prisma.knowledgeItem.update({ where: { id: Number(id) }, data });

const remove = (id) =>
  prisma.knowledgeItem.delete({ where: { id: Number(id) } });

module.exports = { create, findById, findDuplicate, list, update, remove };
