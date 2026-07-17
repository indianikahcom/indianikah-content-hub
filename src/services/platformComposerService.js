const postVariantRepository = require("../repositories/postVariantRepository");
const AppError = require("../errors/AppError");

const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "X", "LINKEDIN", "TELEGRAM", "WHATSAPP", "YOUTUBE"];

function clean(value) {
    if (value === undefined || value === null) return "";
    return String(value).trim();
}

function truncate(text, max) {
    const value = clean(text);
    if (value.length <= max) return value;
    return `${value.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function normalizeBody(text) {
    return clean(text)
        .replace(/\n?Please review the article before sharing\.\s*/gi, "\n")
        .replace(/IndiaNikah\s*[—-]\s*100% free forever\.\s*\n+\s*IndiaNikah is 100% free forever\./gi, "IndiaNikah — 100% free forever.")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function parseMetadata(source) {
    if (!source?.metadata) return {};
    if (typeof source.metadata === "object") return source.metadata;
    try {
        return JSON.parse(source.metadata);
    } catch {
        return {};
    }
}

function removeDuplicateAuthor(body, source) {
    const metadata = parseMetadata(source);
    const title = clean(source?.title).toLowerCase();
    const author = clean(metadata.author).toLowerCase();

    if (!title || !author || title !== author) return body;

    return body
        .replace(/^Author:\s*.+\r?\n?/gim, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function sourceBody(post, source) {
    return removeDuplicateAuthor(normalizeBody(post.content), source);
}

function hashtags(sourceType) {
    const common = ["#IndiaNikah", "#Marriage"];
    const byType = {
        PROFILE_SUMMARY: ["#Matrimony", "#Nikah"],
        BOOK: ["#Books", "#FreeResources"],
        GUIDELINE: ["#MarriageGuidance", "#Nikah"],
        BLOG: ["#MarriageAdvice", "#FamilyLife"]
    };
    return [...common, ...(byType[sourceType] || [])].join(" ");
}

function composeFacebook(post, source) {
    return {
        title: post.title,
        content: `${sourceBody(post, source)}\n\n${hashtags(source?.type)}`
    };
}

function composeInstagram(post, source) {
    return {
        title: null,
        content: `${truncate(sourceBody(post, source), 1800)}\n\n${hashtags(source?.type)}`
    };
}

function composeX(post, source) {
    const sourceUrl = clean(source?.sourceUrl);
    const core = clean(post.title);
    const suffix = sourceUrl ? `\n${sourceUrl}` : "";
    return {
        title: null,
        content: truncate(`${core}${suffix} #IndiaNikah`, 280)
    };
}

function composeLinkedIn(post, source) {
    const body = sourceBody(post, source);
    const brandLine = /100% free forever/i.test(body)
        ? ""
        : "\n\nIndiaNikah — 100% free forever.";
    return {
        title: post.title,
        content: `${body}${brandLine}\n\n${hashtags(source?.type)}`
    };
}

function composeTelegram(post, source) {
    return {
        title: post.title,
        content: sourceBody(post, source)
    };
}

function composeWhatsApp(post, source) {
    return {
        title: null,
        content: truncate(sourceBody(post, source), 2000)
    };
}

function composeYouTube(post, source) {
    const url = clean(source?.sourceUrl);
    return {
        title: truncate(post.title, 100),
        content: truncate(`${sourceBody(post, source)}${url ? `\n\nSource video: ${url}` : ""}`, 5000)
    };
}

const composers = {
    FACEBOOK: composeFacebook,
    INSTAGRAM: composeInstagram,
    X: composeX,
    LINKEDIN: composeLinkedIn,
    TELEGRAM: composeTelegram,
    WHATSAPP: composeWhatsApp,
    YOUTUBE: composeYouTube
};

async function composeForPost(postId) {
    const id = Number(postId);
    if (!Number.isInteger(id) || id < 1) {
        throw new AppError("Invalid post ID", 400);
    }

    const post = await postVariantRepository.findPostWithSource(id);
    if (!post) throw new AppError(`Post ${id} not found`, 404);

    const variants = [];
    for (const platform of PLATFORMS) {
        if (platform === "YOUTUBE" && post.source?.type !== "GUIDELINE") continue;
        const data = composers[platform](post, post.source);
        variants.push(await postVariantRepository.upsertVariant(post.id, platform, data));
    }

    return { postId: post.id, count: variants.length, variants };
}

async function getVariants(postId) {
    return postVariantRepository.findByPostId(Number(postId));
}

module.exports = {
    composeForPost,
    getVariants,
    PLATFORMS
};
