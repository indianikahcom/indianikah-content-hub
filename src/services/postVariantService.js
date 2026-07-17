const postVariantRepository = require("../repositories/postVariantRepository");
const AppError = require("../errors/AppError");

async function getVariant(id) {
    const variant = await postVariantRepository.findById(Number(id));
    if (!variant) throw new AppError("Platform variant not found", 404);
    return variant;
}

async function updateVariant(id, data) {
    const variant = await getVariant(id);

    if (["PUBLISHED"].includes(variant.status)) {
        throw new AppError("Published variants cannot be edited", 409);
    }

    return postVariantRepository.updateVariant(Number(id), {
        title: data.title ?? null,
        content: data.content,
        status: "DRAFT",
        errorMessage: null
    });
}

async function updateVariantStatus(id, status) {
    const variant = await getVariant(id);

    if (variant.status === "PUBLISHED") {
        throw new AppError("Published variants cannot change status", 409);
    }

    if (status === "READY" && !variant.content.trim()) {
        throw new AppError("Variant content is required before marking READY", 400);
    }

    return postVariantRepository.updateVariant(Number(id), {
        status,
        errorMessage: null
    });
}

module.exports = {
    updateVariant,
    updateVariantStatus
};
