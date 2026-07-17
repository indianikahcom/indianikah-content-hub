const promptService = require("../services/promptService");
async function list(req, res, next) { try { const data = await promptService.listPrompts(); return res.json({ success: true, count: data.length, data }); } catch (e) { return next(e); } }
async function update(req, res, next) { try { const data = await promptService.updatePrompt(req.params.key, req.body.content); return res.json({ success: true, message: "Prompt updated", data }); } catch (e) { return next(e); } }
module.exports = { list, update };
