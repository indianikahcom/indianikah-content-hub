const sourceService = require("../services/sourceService");

async function createSource(req, res, next) {
    try {
        const source = await sourceService.createSource(req.body);
        return res.status(201).json({ success: true, message: "Content source created successfully", data: source });
    } catch (error) { return next(error); }
}

async function getAllSources(req, res, next) {
    try {
        const result = await sourceService.getAllSources(req.validatedQuery || req.query);
        return res.json({ success: true, count: result.items.length, pagination: result.pagination, data: result.items });
    } catch (error) { return next(error); }
}

async function getSourceById(req, res, next) {
    try {
        const source = await sourceService.getSourceById(req.validatedParams.id);
        return res.json({ success: true, data: source });
    } catch (error) { return next(error); }
}

async function updateSourceStatus(req, res, next) {
    try {
        const source = await sourceService.updateSourceStatus(req.validatedParams.id, req.body.status);
        return res.json({ success: true, message: "Content source status updated successfully", data: source });
    } catch (error) { return next(error); }
}

async function generateDraftPost(req, res, next) {
    try {
        const result = await sourceService.generateDraftPost(req.validatedParams.id, req.body);
        return res.status(201).json({ success: true, message: "Draft post generated successfully", data: result });
    } catch (error) { return next(error); }
}

module.exports = {
    createSource,
    getAllSources,
    getSourceById,
    updateSourceStatus,
    generateDraftPost
};
