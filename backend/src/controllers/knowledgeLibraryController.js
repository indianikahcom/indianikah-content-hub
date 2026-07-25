const service = require("../services/knowledgeLibraryService");
const generationService = require("../services/knowledgePostGenerationService");
const wrap = (fn) => async (req, res, next) => { try { res.json({ success: true, data: await fn(req) }); } catch (error) { next(error); } };

module.exports = {
  generatePost: async (req, res, next) => {
    try {
      const data = await generationService.generateKnowledgePost(req.body.type);
      res.status(201).json({ success: true, message: "Grounded AI draft generated", data });
    } catch (error) {
      next(error);
    }
  },
  stats: wrap(() => service.stats()),
  search: wrap((req) => service.search(req.body)),
  context: wrap((req) => service.buildContext(req.body)),
  bulkCreate: async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.bulkCreate(req.body.items, { approve: req.body.approve }) }); } catch (error) { next(error); } },
  listPacks: wrap(() => service.listPacks()),
  getPack: wrap((req) => service.getPack(req.params.id)),
  createPack: async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.createPack(req.body) }); } catch (error) { next(error); } },
  updatePack: wrap((req) => service.updatePack(req.params.id, req.body)),
  deletePack: wrap((req) => service.deletePack(req.params.id)),
  addPackItem: async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.addPackItem(req.params.id, req.body) }); } catch (error) { next(error); } },
  removePackItem: wrap((req) => service.removePackItem(req.params.id, req.params.knowledgeItemId)),
};
