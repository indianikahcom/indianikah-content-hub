const service = require("../services/campaignService");

async function publish(req, res, next) {
  try {
    const data = await service.publish(req.params.id, req.body.platforms || "ALL");
    res.status(201).json({ success: true, message: "Publishing campaign completed", data });
  } catch (error) { next(error); }
}

async function retry(req, res, next) {
  try {
    const data = await service.retry(req.params.id);
    res.json({ success: true, message: "Failed platforms retried", data });
  } catch (error) { next(error); }
}

async function list(req, res, next) {
  try {
    const data = await service.listByPostId(req.params.id);
    res.json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
}

module.exports = { publish, retry, list };
