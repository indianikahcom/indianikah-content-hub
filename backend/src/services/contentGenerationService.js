const {
    BRAND_BLOCK,
    appendBranding
} = require("../config/branding");
const contentGenerationRepository = require("../repositories/contentGenerationRepository");
const sourceService = require("./sourceService");
const AppError = require("../errors/AppError");

function parseMetadata(source) {
    if (!source?.metadata) return {};
    if (typeof source.metadata === "object") return source.metadata;
    try {
        return JSON.parse(source.metadata);
    } catch {
        return {};
    }
}

function clean(value) {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text || null;
}

function bookTemplate(source) {
    const metadata = parseMetadata(source);
    const title = clean(source.title) || "Recommended Islamic reading";
    const author = clean(metadata.author);
    const language = clean(metadata.language);
    const pdfUrl = clean(metadata.pdfUrl);

    const lines = [
        `ðŸ“š Recommended reading: ${title}`,
        author ? `Author: ${author}` : null,
        language ? `Language: ${language}` : null,
        "",
        "Read and benefit from this free resource on IndiaNikah.",
        pdfUrl ? `Read here: ${pdfUrl}` : null,
        "",
        "IndiaNikah â€” 100% free forever."
    ].filter((line) => line !== null);

    return {
        title: `Book recommendation: ${title}`,
        content: lines.join("\n")
    };
}

function guidelineTemplate(source) {
    const metadata = parseMetadata(source);
    const title = clean(source.title) || "Marriage guidance";
    const hindiTitle = clean(metadata.titleHindi);
    const videoUrl = clean(source.sourceUrl);

    const lines = [
        `ðŸ’¡ Marriage Guidance`,
        title,
        hindiTitle ? `(${hindiTitle})` : null,
        "",
        "Watch this short guidance and discuss the topic with your family before making an important marriage decision.",
        videoUrl ? `Watch here: ${videoUrl}` : null,
        "",
        "IndiaNikah â€” 100% free forever."
    ].filter((line) => line !== null);

    return {
        title: `Marriage guidance: ${title}`,
        content: lines.join("\n")
    };
}

function blogTemplate(source) {
    const metadata = parseMetadata(source);
    const title = clean(source.title) || "New marriage article";
    const previewTitle = clean(metadata.previewTitle);
    const link = clean(source.sourceUrl);

    const lines = [
        `ðŸ“ New article`,
        title,
        previewTitle && previewTitle !== title ? previewTitle : null,
        "",
        "Read the full article for practical guidance on marriage and family life.",
        link ? `Read here: ${link}` : null,
        "",
        "Please review the article before sharing. IndiaNikah â€” 100% free forever."
    ].filter((line) => line !== null);

    return {
        title: `Article: ${title}`,
        content: lines.join("\n")
    };
}

const templates = {
    BOOK: bookTemplate,
    GUIDELINE: guidelineTemplate,
    BLOG: blogTemplate
};

async function generateNext(type) {
    const normalizedType = String(type || "").trim().toUpperCase();
    const template = templates[normalizedType];

    if (!template) {
        throw new AppError(`Unsupported generated content type: ${normalizedType}`, 400);
    }

    const source = await contentGenerationRepository.findNextUnusedSource(normalizedType);
    if (!source) {
        return {
            type: normalizedType,
            created: false,
            message: `No unused ${normalizedType.toLowerCase()} sources are available`,
            remaining: 0,
            post: null
        };
    }

    const draft = await sourceService.generateDraftPost(source.id, template(source));
    const remaining = await contentGenerationRepository.countUnusedSources(normalizedType);

    return {
        type: normalizedType,
        created: true,
        message: `${normalizedType} draft generated`,
        remaining,
        post: draft.post,
        source: draft.source
    };
}

async function generateBundle() {
    const results = {};
    for (const type of ["BOOK", "GUIDELINE", "BLOG"]) {
        results[type.toLowerCase()] = await generateNext(type);
    }

    return {
        createdCount: Object.values(results).filter((item) => item.created).length,
        results
    };
}

module.exports = {
    generateNext,
    generateBundle
};

