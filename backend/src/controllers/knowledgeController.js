const service = require("../services/knowledgeService");

const create = async (req, res, next) => {
  try {
    res.status(201).json({ success: true, data: await service.create(req.body) });
  } catch (error) { next(error); }
};

const list = async (req, res, next) => {
  try {
    const result = await service.list(req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) { next(error); }
};

const get = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.get(req.params.id) });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.update(req.params.id, req.body) });
  } catch (error) { next(error); }
};

const changeStatus = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await service.changeStatus(req.params.id, req.body.status),
    });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.remove(req.params.id) });
  } catch (error) { next(error); }
};

module.exports = { create, list, get, update, changeStatus, remove };
