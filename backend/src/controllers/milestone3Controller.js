const milestone3Service = require("../services/milestone3Service");

async function generateSource(req, res, next) {
    try {
        const data = await milestone3Service.generateFromSource(req.params.sourceId, req.body);
        return res.status(201).json({ success: true, message: "Draft and platform variants generated", data });
    } catch (error) { return next(error); }
}

async function generateBatch(req, res, next) {
    try {
        const data = await milestone3Service.generateBatch(req.body);
        return res.status(201).json({ success: true, message: "Batch generation completed", data });
    } catch (error) { return next(error); }
}

async function preview(req, res, next) {
    try {
        const data = await milestone3Service.getPreview(req.params.postId);
        return res.json({ success: true, data });
    } catch (error) { return next(error); }
}

module.exports = { generateSource, generateBatch, preview };
