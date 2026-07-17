const AppError = require("../../errors/AppError");

const DEFAULT_GRAPH_VERSION = "v25.0";
const GRAPH_BASE_URL = "https://graph.facebook.com";
const REQUEST_TIMEOUT_MS = 30000;
const CONTAINER_CHECK_ATTEMPTS = 12;
const CONTAINER_CHECK_DELAY_MS = 2000;

const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

function instagramConfig() {
    const configuredVersion = String(
        process.env.INSTAGRAM_GRAPH_VERSION ||
        process.env.FACEBOOK_GRAPH_VERSION ||
        DEFAULT_GRAPH_VERSION
    ).trim();

    return {
        enabled:
            String(process.env.INSTAGRAM_PUBLISH_ENABLED).toLowerCase() ===
            "true",
        userId: String(process.env.INSTAGRAM_USER_ID || "").trim(),
        accessToken: String(
            process.env.INSTAGRAM_SYSTEM_USER_TOKEN || ""
        ).trim(),
        defaultImageUrl: String(
            process.env.INSTAGRAM_DEFAULT_IMAGE_URL || ""
        ).trim(),
        version: configuredVersion.startsWith("v")
            ? configuredVersion
            : `v${configuredVersion}`,
    };
}

function requireInstagramConfig() {
    const config = instagramConfig();

    if (!config.enabled) {
        throw new AppError("Instagram publishing is disabled", 409);
    }

    if (!config.userId || !config.accessToken) {
        throw new AppError(
            "Instagram User ID or System User token is not configured",
            503
        );
    }

    return config;
}

function variantFor(post, platform) {
    return (post.variants || []).find(
        (variant) => String(variant.platform).toUpperCase() === platform
    );
}

function buildCaption(post) {
    const content = String(
        variantFor(post, "INSTAGRAM")?.content ||
        post.content ||
        post.title ||
        ""
    ).trim();

    if (!content) {
        throw new AppError("Instagram caption is empty", 400);
    }

    // Instagram captions allow 2,200 characters. Keep a small safety margin.
    const maximumLength = 2150;

    if (content.length <= maximumLength) {
        return content;
    }

    return `${content.slice(0, maximumLength - 3).trim()}...`;
}

function parseMetadata(metadata) {
    if (!metadata) return {};
    if (typeof metadata === "object") return metadata;

    if (typeof metadata === "string") {
        try {
            return JSON.parse(metadata);
        } catch {
            return {};
        }
    }

    return {};
}

function firstHttpsUrl(values) {
    return values.find(
        (value) =>
            typeof value === "string" &&
            value.trim().toLowerCase().startsWith("https://")
    )?.trim();
}

function resolveImageUrl(post, defaultImageUrl) {
    const source = post.source || {};
    const metadata = parseMetadata(source.metadata);

    return firstHttpsUrl([
        post.imageUrl,
        post.image_url,
        source.imageUrl,
        source.image_url,
        source.thumbnailUrl,
        source.thumbnail_url,
        source.coverUrl,
        source.cover_url,
        metadata.imageUrl,
        metadata.image_url,
        metadata.thumbnailUrl,
        metadata.thumbnail_url,
        metadata.coverUrl,
        metadata.cover_url,
        metadata.featuredImage,
        metadata.featured_image,
        metadata.youtubeThumbnail,
        metadata.youtube_thumbnail,
        defaultImageUrl,
    ]);
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error.name === "AbortError") {
            throw new AppError("Instagram request timed out", 504);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function readJson(response) {
    const text = await response.text();

    if (!text) return {};

    try {
        return JSON.parse(text);
    } catch {
        return { rawResponse: text.slice(0, 1000) };
    }
}

function instagramErrorMessage(payload, fallback) {
    const error = payload?.error;

    if (!error) return fallback;

    return [
        error.error_user_msg,
        error.message,
        error.code ? `code ${error.code}` : null,
        error.error_subcode ? `subcode ${error.error_subcode}` : null,
    ]
        .filter(Boolean)
        .join(" · ");
}

async function graphPost(config, path, values) {
    const body = new URLSearchParams();

    Object.entries(values || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            body.set(key, String(value));
        }
    });

    body.set("access_token", config.accessToken);

    const response = await fetchWithTimeout(
        `${GRAPH_BASE_URL}/${config.version}/${path}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        }
    );

    const payload = await readJson(response);

    if (!response.ok || payload.error) {
        throw new AppError(
            instagramErrorMessage(payload, "Instagram request failed"),
            response.status >= 400 ? response.status : 502
        );
    }

    return payload;
}

async function graphGet(config, path, fields) {
    const url = new URL(`${GRAPH_BASE_URL}/${config.version}/${path}`);
    if (fields) url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", config.accessToken);

    const response = await fetchWithTimeout(url);
    const payload = await readJson(response);

    if (!response.ok || payload.error) {
        throw new AppError(
            instagramErrorMessage(payload, "Instagram request failed"),
            response.status >= 400 ? response.status : 502
        );
    }

    return payload;
}

async function createImageContainer(config, imageUrl, caption) {
    const payload = await graphPost(config, `${config.userId}/media`, {
        image_url: imageUrl,
        caption,
    });

    if (!payload.id) {
        throw new AppError(
            "Instagram did not return a media container ID",
            502
        );
    }

    return String(payload.id);
}

async function waitForContainer(config, creationId) {
    for (let attempt = 1; attempt <= CONTAINER_CHECK_ATTEMPTS; attempt += 1) {
        const payload = await graphGet(
            config,
            creationId,
            "id,status_code,status"
        );

        const statusCode = String(payload.status_code || "").toUpperCase();

        if (statusCode === "FINISHED") return payload;

        if (["ERROR", "EXPIRED"].includes(statusCode)) {
            throw new AppError(
                payload.status ||
                `Instagram container status is ${statusCode}`,
                502
            );
        }

        // Some image containers briefly return no status_code.
        if (attempt < CONTAINER_CHECK_ATTEMPTS) {
            await sleep(CONTAINER_CHECK_DELAY_MS);
        }
    }

    throw new AppError(
        "Instagram media container was not ready in time",
        504
    );
}

async function publishContainer(config, creationId) {
    const payload = await graphPost(
        config,
        `${config.userId}/media_publish`,
        { creation_id: creationId }
    );

    if (!payload.id) {
        throw new AppError(
            "Instagram did not return a published media ID",
            502
        );
    }

    return String(payload.id);
}

async function publishInstagram(post) {
    const config = requireInstagramConfig();
    const caption = buildCaption(post);
    const imageUrl = resolveImageUrl(post, config.defaultImageUrl);

    if (!imageUrl) {
        throw new AppError(
            "Instagram requires a public HTTPS image URL. Configure INSTAGRAM_DEFAULT_IMAGE_URL or add an image URL to the post/source metadata.",
            400
        );
    }

    const creationId = await createImageContainer(
        config,
        imageUrl,
        caption
    );

    await waitForContainer(config, creationId);

    const mediaId = await publishContainer(config, creationId);
    const media = await graphGet(
        config,
        mediaId,
        "id,caption,media_type,permalink,timestamp,username"
    );

    return {
        destination: media.username
            ? `@${media.username}`
            : config.userId,
        externalMessageId: mediaId,
        responseData: {
            creationId,
            mediaId,
            imageUrl,
            permalink: media.permalink || null,
            mediaType: media.media_type || "IMAGE",
            timestamp: media.timestamp || null,
            username: media.username || null,
            graphVersion: config.version,
        },
    };
}

module.exports = {
    instagramConfig,
    publishInstagram,
    resolveImageUrl,
};
