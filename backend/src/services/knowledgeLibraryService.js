const repository = require("../repositories/knowledgeLibraryRepository");
const contextService = require("./knowledgeContextService");
const knowledgeService = require("./knowledgeService");
const AppError = require("../errors/AppError");

const bulkCreate = async (items, { approve = false } = {}) => {
  if (!items?.length) throw new AppError("At least one knowledge item is required", 400);
  const prepared = items.map((item) => ({ ...item, status: approve ? "APPROVED" : (item.status || "DRAFT") }));
  const created = [];
  for (const item of prepared) created.push(await knowledgeService.create(item));
  return { created, count: created.length };
};

const createPack = (payload) => repository.createPack(payload);
const listPacks = () => repository.listPacks();
const getPack = async (id) => {
  const pack = await repository.findPack(id);
  if (!pack) throw new AppError("Knowledge pack not found", 404);
  return pack;
};
const updatePack = async (id, payload) => { await getPack(id); return repository.updatePack(id, payload); };
const deletePack = async (id) => { await getPack(id); await repository.deletePack(id); return { id: Number(id), deleted: true }; };
const addPackItem = async (packId, payload) => { await getPack(packId); return repository.addPackItem({ packId, ...payload }); };
const removePackItem = async (packId, knowledgeItemId) => { await getPack(packId); await repository.removePackItem(packId, knowledgeItemId); return { packId: Number(packId), knowledgeItemId: Number(knowledgeItemId), removed: true }; };

module.exports = {
  bulkCreate,
  stats: repository.stats,
  search: contextService.buildContext,
  buildContext: contextService.buildContext,
  createPack,
  listPacks,
  getPack,
  updatePack,
  deletePack,
  addPackItem,
  removePackItem,
};
