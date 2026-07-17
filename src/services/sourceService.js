const sourceRepository = require("../repositories/sourceRepository");
const AppError = require("../errors/AppError");

const allowedTransitions = {
    NEW: ["PROCESSING", "REJECTED", "ARCHIVED"],
    PROCESSING: ["NEW", "PROCESSED", "REJECTED"],
    PROCESSED: ["ARCHIVED"],
    REJECTED: ["NEW", "ARCHIVED"],
    ARCHIVED: ["NEW"]
};

function serializeMetadata(metadata) {
    if (metadata === undefined || metadata === null || metadata === "") return null;
    return typeof metadata === "string" ? metadata : JSON.stringify(metadata);
}

function parseMetadata(metadata) {
    if (!metadata) return null;
    try {
        return JSON.parse(metadata);
    } catch {
        return metadata;
    }
}

function present(source) {
    return { ...source, metadata: parseMetadata(source.metadata) };
}

async function createSource(sourceData) {
    const externalId = sourceData.externalId?.trim() || null;
    if (externalId && await sourceRepository.findByExternalId(externalId)) {
        throw new AppError(`A content source with external ID "${externalId}" already exists`, 409);
    }

    const source = await sourceRepository.create({
        type: sourceData.type.trim().toUpperCase(),
        title: sourceData.title?.trim() || null,
        sourceUrl: sourceData.sourceUrl?.trim() || null,
        externalId,
        rawContent: sourceData.rawContent?.trim() || null,
        metadata: serializeMetadata(sourceData.metadata),
        status: "NEW"
    });

    return present(source);
}

async function getAllSources(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const result = await sourceRepository.findAll({
        type: filters.type?.trim().toUpperCase(),
        status: filters.status?.trim().toUpperCase(),
        search: filters.search?.trim(),
        page,
        limit
    });

    return {
        items: result.items.map(present),
        pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
        }
    };
}

async function getSourceById(id) {
    const source = await sourceRepository.findById(id);
    if (!source) throw new AppError("Content source not found", 404);
    return present(source);
}

async function updateSourceStatus(id, requestedStatus) {
    const source = await sourceRepository.findById(id);
    if (!source) throw new AppError("Content source not found", 404);

    const allowedStatuses = allowedTransitions[source.status] || [];
    if (!allowedStatuses.includes(requestedStatus)) {
        throw new AppError(
            `Cannot change content source status from ${source.status} to ${requestedStatus}`,
            409,
            { currentStatus: source.status, requestedStatus, allowedStatuses }
        );
    }

    return present(await sourceRepository.updateStatus(id, requestedStatus));
}

function defaultPostContent(source) {
    const parts = [];
    if (source.title) parts.push(source.title);
    if (source.rawContent) parts.push(source.rawContent);
    if (source.sourceUrl) parts.push(`Source: ${source.sourceUrl}`);
    return parts.join("\n\n").trim();
}

async function generateDraftPost(id, overrides = {}) {
    const source = await sourceRepository.findById(id);
    if (!source) throw new AppError("Content source not found", 404);
    if (source.post) throw new AppError("A draft post has already been generated from this source", 409, { postId: source.post.id });
    if (["REJECTED", "ARCHIVED"].includes(source.status)) {
        throw new AppError(`Cannot generate a post from a ${source.status} source`, 409);
    }

    const title = overrides.title || source.title || `${source.type} content`;
    const content = overrides.content || defaultPostContent(source);
    if (!content) throw new AppError("Source has no content. Provide content in the request body.", 400);

    const result = await sourceRepository.createDraftPostFromSource(source, { title, content });
    return { post: result.post, source: present(result.source) };
}

module.exports = {
    createSource,
    getAllSources,
    getSourceById,
    updateSourceStatus,
    generateDraftPost
};
