const contentGenerationService = require("../services/contentGenerationService");

async function generateNext(req, res, next) {
    try {
        const data = await contentGenerationService.generateNext(req.params.type);
        return res.status(data.created ? 201 : 200).json({
            success: true,
            message: data.message,
            data
        });
    } catch (error) {
        return next(error);
    }
}

async function generateBundle(req, res, next) {
    try {
        const data = await contentGenerationService.generateBundle();
        return res.status(201).json({
            success: true,
            message: `${data.createdCount} content draft(s) generated`,
            data
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    generateNext,
    generateBundle
};
