const prisma = require("../database/prisma");

const listApprovedCandidates = ({ types, languages, packId } = {}) => {
  const where = { status: "APPROVED" };
  if (types?.length) where.type = { in: types };
  if (languages?.length) where.language = { in: languages };
  if (packId) where.packItems = { some: { packId: Number(packId) } };

  return prisma.knowledgeItem.findMany({
    where,
    include: { packItems: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 500,
  });
};

const createMany = (items) => prisma.$transaction(
  items.map((data) => prisma.knowledgeItem.create({ data }))
);

const stats = async () => {
  const [total, approved, draft, byType, byLanguage, packs] = await prisma.$transaction([
    prisma.knowledgeItem.count(),
    prisma.knowledgeItem.count({ where: { status: "APPROVED" } }),
    prisma.knowledgeItem.count({ where: { status: "DRAFT" } }),
    prisma.knowledgeItem.groupBy({ by: ["type"], _count: { _all: true }, orderBy: { _count: { type: "desc" } } }),
    prisma.knowledgeItem.groupBy({ by: ["language"], _count: { _all: true }, orderBy: { _count: { language: "desc" } } }),
    prisma.knowledgePack.count({ where: { isActive: true } }),
  ]);
  return { total, approved, draft, activePacks: packs, byType, byLanguage };
};

const listPacks = () => prisma.knowledgePack.findMany({
  include: {
    items: {
      include: { knowledgeItem: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    },
  },
  orderBy: [{ isActive: "desc" }, { name: "asc" }],
});

const findPack = (idOrKey) => {
  const numeric = Number(idOrKey);
  return prisma.knowledgePack.findFirst({
    where: Number.isInteger(numeric) && String(numeric) === String(idOrKey)
      ? { id: numeric }
      : { key: String(idOrKey) },
    include: {
      items: {
        include: { knowledgeItem: true },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
    },
  });
};

const createPack = (data) => prisma.knowledgePack.create({ data });
const updatePack = (id, data) => prisma.knowledgePack.update({ where: { id: Number(id) }, data });
const deletePack = (id) => prisma.knowledgePack.delete({ where: { id: Number(id) } });
const addPackItem = (data) => prisma.knowledgePackItem.upsert({
  where: { packId_knowledgeItemId: { packId: Number(data.packId), knowledgeItemId: Number(data.knowledgeItemId) } },
  create: { ...data, packId: Number(data.packId), knowledgeItemId: Number(data.knowledgeItemId) },
  update: { priority: data.priority, notes: data.notes },
});
const removePackItem = (packId, knowledgeItemId) => prisma.knowledgePackItem.delete({
  where: { packId_knowledgeItemId: { packId: Number(packId), knowledgeItemId: Number(knowledgeItemId) } },
});
const logContext = (records) => records.length
  ? prisma.knowledgeContextLog.createMany({ data: records })
  : Promise.resolve({ count: 0 });

module.exports = {
  listApprovedCandidates,
  createMany,
  stats,
  listPacks,
  findPack,
  createPack,
  updatePack,
  deletePack,
  addPackItem,
  removePackItem,
  logContext,
};
