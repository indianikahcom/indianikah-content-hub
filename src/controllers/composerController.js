const platformComposerService = require("../services/platformComposerService");
const postVariantService = require("../services/postVariantService");

async function compose(req, res, next) {
    try {
        const data = await platformComposerService.composeForPost(req.params.postId);
        return res.status(201).json({
            success: true,
            message: `${data.count} platform variants composed`,
            data
        });
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        const data = await platformComposerService.getVariants(req.params.postId);
        return res.json({ success: true, count: data.length, data });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const data = await postVariantService.updateVariant(
            req.params.variantId,
            req.body
        );
        return res.json({
            success: true,
            message: "Platform variant updated",
            data
        });
    } catch (error) {
        return next(error);
    }
}

async function updateStatus(req, res, next) {
    try {
        const data = await postVariantService.updateVariantStatus(
            req.params.variantId,
            req.body.status
        );
        return res.json({
            success: true,
            message: `Platform variant moved to ${data.status}`,
            data
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    compose,
    list,
    update,
    updateStatus
};
