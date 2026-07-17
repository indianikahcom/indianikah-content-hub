const AppError = require("../../errors/AppError");
const {
    imageGenerationConfig,
    generatePostImage,
} = require("../aiImageGenerationService");

const DEFAULT_GRAPH_VERSION = "v25.0";
const REQUEST_TIMEOUT_MS = 30000;
const STATUS_POLL_ATTEMPTS = 10;
const STATUS_POLL_DELAY_MS = 2000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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
        systemToken: String(
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

    if (!config.userId || !config.systemToken) {
        throw new AppError(
            "Instagram User ID or System User token is not configured",
            503
        );
    }

    return config;
}

function parseMetadata(value) {
    if (!value) return {};
    if (typeof value === "object") return value;

    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

function imageCandidates(post, config) {
    const metadata = parseMetadata(post?.source?.metadata);
    const rawContent = parseMetadata(post?.source?.rawContent);

    return [
        post?.imageUrl,
        metadata.imageUrl,
        metadata.image_url,
        metadata.coverUrl,
        metadata.cover_url,
        metadata.thumbnailUrl,
        metadata.thumbnail_url,
        metadata.featuredImage,
        metadata.featured_image,
        rawContent.imageUrl,
        rawContent.image_url,
        rawContent.coverUrl,
        rawContent.cover_url,
        rawContent.thumbnailUrl,
        rawContent.thumbnail_url,
    ]
        .map((value) => String(value || "").trim())
        .filter((value) => /^https:\/\//i.test(value));
}

async function isPublicImageUrl(url) {
    if (!/^https:\/\//i.test(String(url || ""))) return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        let response = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            signal: controller.signal,
            headers: { "User-Agent": "IndiaNikah-Content-Hub/1.0" },
        });

        if (response.status === 405 || response.status === 403) {
            response = await fetch(url, {
                method: "GET",
                redirect: "follow",
                signal: controller.signal,
                headers: {
                    Range: "bytes=0-1023",
                    "User-Agent": "IndiaNikah-Content-Hub/1.0",
                },
            });
        }

        const contentType = String(
            response.headers.get("content-type") || ""
        ).toLowerCase();

        return response.ok && contentType.startsWith("image/");
    } catch {
        return false;
    } finally {
        clearTimeout(timeout);
    }
}

async function resolveImageUrl(post, config) {
    for (const candidate of imageCandidates(post, config)) {
        if (await isPublicImageUrl(candidate)) {
            return { imageUrl: candidate, imageSource: "SOURCE" };
        }
    }

    const aiConfig = imageGenerationConfig();
    if (aiConfig.enabled) {
        try {
            const generated = await generatePostImage(post);
            if (await isPublicImageUrl(generated.publicUrl)) {
                return {
                    imageUrl: generated.publicUrl,
                    imageSource: generated.cached ? "AI_CACHE" : "AI_GENERATED",
                    generatedImage: generated,
                };
            }
        } catch (error) {
            console.error("AI image generation failed; using fallback:", error.message);
        }
    }

    if (await isPublicImageUrl(config.defaultImageUrl)) {
        return {
            imageUrl: config.defaultImageUrl,
            imageSource: "DEFAULT_FALLBACK",
        };
    }

    return { imageUrl: null, imageSource: null };
}

function contentFor(post) {
    const variant = (post.variants || []).find(
        (item) => String(item.platform).toUpperCase() === "INSTAGRAM"
    );

    return String(variant?.content || post.content || post.title || "").trim();
}

function instagramErrorMessage(payload, fallback) {
    return String(
        payload?.error?.error_user_msg ||
        payload?.error?.message ||
        payload?.message ||
        fallback
    );
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

async function graphPost(config, path, values) {
    const body = new URLSearchParams();

    Object.entries(values || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            body.set(key, String(value));
        }
    });

    body.set("access_token", config.systemToken);

    const response = await fetchWithTimeout(
        `https://graph.facebook.com/${config.version}/${path}`,
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
    const url = new URL(
        `https://graph.facebook.com/${config.version}/${path}`
    );
    if (fields) url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", config.systemToken);

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

async function waitUntilContainerReady(config, creationId) {
    for (let attempt = 1; attempt <= STATUS_POLL_ATTEMPTS; attempt += 1) {
        const status = await graphGet(
            config,
            creationId,
            "id,status_code,status"
        );

        const code = String(status.status_code || "").toUpperCase();

        if (code === "FINISHED" || !code) {
            return status;
        }

        if (["ERROR", "EXPIRED"].includes(code)) {
            throw new AppError(
                status.status || `Instagram container status is ${code}`,
                502
            );
        }

        if (attempt < STATUS_POLL_ATTEMPTS) {
            await sleep(STATUS_POLL_DELAY_MS);
        }
    }

    throw new AppError("Instagram media container was not ready in time", 504);
}

async function testInstagramConnection() {
    const config = requireInstagramConfig();
    const account = await graphGet(
        config,
        config.userId,
        "id,username,account_type"
    );

    return {
        connected: true,
        platform: "INSTAGRAM",
        userId: account.id,
        username: account.username || null,
        accountType: account.account_type || null,
        graphVersion: config.version,
    };
}

async function publishInstagram(post) {
    const config = requireInstagramConfig();
    const caption = contentFor(post);
    const image = await resolveImageUrl(post, config);
    const imageUrl = image.imageUrl;

    if (!caption) {
        throw new AppError("Instagram content is empty", 400);
    }

    if (!imageUrl) {
        throw new AppError(
            "Instagram requires a public HTTPS image URL. Configure INSTAGRAM_DEFAULT_IMAGE_URL or provide an image URL in source metadata.",
            400
        );
    }

    const container = await graphPost(config, `${config.userId}/media`, {
        image_url: imageUrl,
        caption,
    });

    if (!container.id) {
        throw new AppError(
            "Instagram did not return a media creation ID",
            502
        );
    }

    await waitUntilContainerReady(config, container.id);

    const published = await graphPost(
        config,
        `${config.userId}/media_publish`,
        { creation_id: container.id }
    );

    if (!published.id) {
        throw new AppError(
            "Instagram did not return a published media ID",
            502
        );
    }

    const media = await graphGet(
        config,
        published.id,
        "id,caption,media_type,permalink,timestamp,username"
    );

    return {
        destination: media.username
            ? `@${media.username}`
            : config.userId,
        externalMessageId: String(published.id),
        responseData: {
            creationId: String(container.id),
            mediaId: String(published.id),
            imageUrl,
            imageSource: image.imageSource,
            generatedImage: image.generatedImage || null,
            permalink: media.permalink || null,
            mediaType: media.media_type || "IMAGE",
            timestamp: media.timestamp || null,
            graphVersion: config.version,
        },
    };
}

module.exports = {
    instagramConfig,
    testInstagramConnection,
    publishInstagram,
};
