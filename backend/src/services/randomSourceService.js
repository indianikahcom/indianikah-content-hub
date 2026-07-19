const repository = require("../repositories/randomSourceRepository");
const AppError = require("../errors/AppError");

function parseJson(value) {
    if (!value || typeof value === "object") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

function normalizePublication(publication) {
    return {
        ...publication,
        responseData: parseJson(publication.responseData)
    };
}

function normalizePost(post) {
    return {
        ...post,

        publications: Array.isArray(post.publications)
            ? post.publications.map(normalizePublication)
            : [],

        campaigns: Array.isArray(post.campaigns)
            ? post.campaigns.map((campaign) => ({
                ...campaign,
                publications: Array.isArray(campaign.publications)
                    ? campaign.publications.map(normalizePublication)
                    : []
            }))
            : []
    };
}

async function getRandomUnpublishedSource({
                                              type,
                                              platform = "TELEGRAM"
                                          }) {
    const normalizedType = String(type || "")
        .trim()
        .toUpperCase();

    const normalizedPlatform = String(platform || "TELEGRAM")
        .trim()
        .toUpperCase();

    if (!["BOOK", "GUIDELINE", "BLOG"].includes(normalizedType)) {
        throw new AppError(
            "Random selection supports BOOK, GUIDELINE, and BLOG only",
            400
        );
    }

    const source = await repository.findRandomUnpublished({
        type: normalizedType,
        platform: normalizedPlatform
    });

    if (!source) {
        throw new AppError(
            `No unpublished ${normalizedType.toLowerCase()} source is available`,
            404
        );
    }

    const posts = Array.isArray(source.posts)
        ? source.posts.map(normalizePost)
        : [];

    return {
        ...source,
        metadata: parseJson(source.metadata),

        // Correct Prisma one-to-many relation
        posts,

        // Backward compatibility for services/UI expecting source.post
        post: posts.length > 0 ? posts[0] : null
    };
}

module.exports = {
    getRandomUnpublishedSource
};