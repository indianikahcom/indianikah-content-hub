const { requestJson } = require("./httpClient");

const RELEVANT_HASHTAGS = [
    "#IndiaNikah",
    "#MuslimMatrimony",
    "#IndianMuslims",
    "#Nikah",
    "#Marriage",
    "#Matrimony",
    "#MuslimMarriage",
    "#HalalMatrimony",
    "#MarriageInIslam",
    "#IslamicMarriage",
    "#MuslimSingles",
    "#Shaadi",
    "#Rishta",
    "#FreeMatrimony",
    "#MarriageGoals",
];

function captionWithHashtags(content) {
    const value = String(content || "").trim();
    const existing = new Set(
        (value.match(/#[\p{L}\p{N}_]+/gu) || [])
            .map((tag) => tag.toLowerCase())
    );
    const missing = RELEVANT_HASHTAGS.filter(
        (tag) => !existing.has(tag.toLowerCase())
    );
    const hashtagBlock = missing.join(" ");
    const separator = value && hashtagBlock ? "\n\n" : "";
    const available =
        2200 - separator.length - hashtagBlock.length;
    const body =
        value.length > available
            ? `${value.slice(0, Math.max(0, available - 1)).trim()}…`
            : value;

    return `${body}${separator}${hashtagBlock}`;
}

function instagramConfig() {
    return {
        enabled:
            String(process.env.INSTAGRAM_PUBLISH_ENABLED).toLowerCase() ===
            "true",
        accountId:
            process.env.INSTAGRAM_USER_ID ||
            process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
        token:
            process.env.INSTAGRAM_SYSTEM_USER_TOKEN ||
            process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        version:
            process.env.INSTAGRAM_GRAPH_VERSION ||
            process.env.FACEBOOK_GRAPH_VERSION ||
            "v25.0",
    };
}

function ensureConfig() {
    const config = instagramConfig();

    if (!config.enabled) {
        throw new Error("Instagram publishing is disabled");
    }
    if (!config.accountId) {
        throw new Error(
            "INSTAGRAM_USER_ID is not configured"
        );
    }
    if (!config.token) {
        throw new Error(
            "INSTAGRAM_SYSTEM_USER_TOKEN is not configured"
        );
    }
    return config;
}

async function ensurePublicImage(imageUrl) {
    let response;

    try {
        response = await fetch(imageUrl, {
            method: "GET",
            headers: {
                Accept: "image/jpeg,image/png,image/*",
                "User-Agent": "IndiaNikah-Instagram-Publisher/1.0",
            },
            signal: AbortSignal.timeout(15000),
        });
    } catch (error) {
        throw new Error(
            `Instagram image is not publicly reachable: ${error.message}`
        );
    }

    const contentType = String(
        response.headers.get("content-type") || ""
    ).toLowerCase();

    if (!response.ok || !contentType.startsWith("image/")) {
        throw new Error(
            `Instagram image URL returned HTTP ${response.status} ` +
            `with Content-Type ${contentType || "unknown"}; ` +
            "deploy the generated-media route and file on the public backend"
        );
    }
}

async function publish({ content, imageUrl }) {
    const config = ensureConfig();
    const mediaUrl = String(imageUrl || "").trim();
    const caption = captionWithHashtags(content);

    if (!/^https:\/\//i.test(mediaUrl)) {
        throw new Error(
            "Instagram publishing requires a public HTTPS image URL"
        );
    }

    await ensurePublicImage(mediaUrl);

    const containerUrl = new URL(
        `https://graph.facebook.com/${config.version}/${config.accountId}/media`
    );
    containerUrl.searchParams.set("image_url", mediaUrl);
    containerUrl.searchParams.set("caption", caption);
    containerUrl.searchParams.set("access_token", config.token);

    const container = await requestJson(containerUrl, {
        method: "POST",
    });

    const publishUrl = new URL(
        `https://graph.facebook.com/${config.version}/${config.accountId}/media_publish`
    );
    publishUrl.searchParams.set(
        "creation_id",
        String(container.id)
    );
    publishUrl.searchParams.set("access_token", config.token);

    const result = await requestJson(publishUrl, {
        method: "POST",
    });

    const externalId = String(result?.id || "");
    let permalink = null;

    if (externalId) {
        try {
            const detailsUrl = new URL(
                `https://graph.facebook.com/${config.version}/${externalId}`
            );
            detailsUrl.searchParams.set("fields", "permalink");
            detailsUrl.searchParams.set("access_token", config.token);
            const details = await requestJson(detailsUrl);
            permalink = details?.permalink || null;
        } catch {
            // Publishing succeeded; a permalink lookup failure is non-fatal.
        }
    }

    return {
        externalId,
        liveUrl: permalink,
        raw: {
            container,
            publication: result,
            imageUrl: mediaUrl,
            permalink,
        },
    };
}

async function testConnection() {
    const config = ensureConfig();
    const url = new URL(
        `https://graph.facebook.com/${config.version}/${config.accountId}`
    );
    url.searchParams.set("fields", "id,username");
    url.searchParams.set("access_token", config.token);
    const account = await requestJson(url);

    return {
        connected: true,
        platform: "INSTAGRAM",
        accountId: account.id,
        username: account.username || null,
        graphVersion: config.version,
    };
}

module.exports = {
    publish,
    publishInstagram: publish,
    testConnection,
    testInstagramConnection: testConnection,
    captionWithHashtags,
};
