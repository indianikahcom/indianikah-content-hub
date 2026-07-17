const repository = require("../repositories/randomSourceRepository");
const AppError = require("../errors/AppError");

function parseJson(value) {
    if (!value || typeof value === "object") return value;
    try { return JSON.parse(value); } catch { return value; }
}

async function getRandomUnpublishedSource({ type, platform = "TELEGRAM" }) {
    const normalizedType = String(type || "").trim().toUpperCase();

    if (!["BOOK", "GUIDELINE", "BLOG"].includes(normalizedType)) {
        throw new AppError("Random selection supports BOOK, GUIDELINE, and BLOG only", 400);
    }

    const source = await repository.findRandomUnpublished({
        type: normalizedType,
        platform
    });

    if (!source) {
        throw new AppError(`No unpublished ${normalizedType.toLowerCase()} source is available`, 404);
    }

    return {
        ...source,
        metadata: parseJson(source.metadata),
        post: source.post ? {
            ...source.post,
            publications: (source.post.publications || []).map(item => ({
                ...item,
                responseData: parseJson(item.responseData)
            }))
        } : null
    };
}

module.exports = { getRandomUnpublishedSource };
