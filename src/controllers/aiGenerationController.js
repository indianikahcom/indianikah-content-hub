const service = require("../services/aiGenerationService");
async function generateSource(req, res, next) { try { return res.status(201).json({ success: true, message: "AI draft generated", data: await service.generateForSource(req.params.id) }); } catch (e) { return next(e); } }
async function regeneratePost(req, res, next) { try { return res.json({ success: true, message: "Post regenerated and returned to DRAFT", data: await service.regeneratePost(req.params.id) }); } catch (e) { return next(e); } }
async function logs(req, res, next) { try { const data = await service.listLogs(req.query.limit); return res.json({ success: true, count: data.length, data }); } catch (e) { return next(e); } }
module.exports = { generateSource, regeneratePost, logs };
