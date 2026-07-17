const AppError = require("../errors/AppError");
const { publishInstagram } = require("./publishers/instagramPublisher");

const DEFAULT_FACEBOOK_GRAPH_VERSION = "v25.0";
const DEFAULT_LINKEDIN_VERSION = "202606";
const REQUEST_TIMEOUT_MS = 30000;

function enabledPlatforms() {
    return [
        ...new Set(
            String(process.env.PUBLISH_PLATFORMS || "TELEGRAM")
                .split(",")
                .map((value) => value.trim().toUpperCase())
                .filter(Boolean)
        ),
    ];
}

function variantFor(post, platform) {
    return (post.variants || []).find(
        (variant) => String(variant.platform).toUpperCase() === platform
    );
}

function contentFor(post, platform) {
    return String(variantFor(post, platform)?.content || post.content || "").trim();
}

function linkedinSafeContent(value) {
    return String(value || "")
        .replace(/[📊👥📍💼💍🎓]/gu, "")
        .replace(/•/g, "-")
        .replace(/[—–]/g, "-")
        .replace(/\u00A0/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error.name === "AbortError") {
            throw new AppError("Platform request timed out", 504);
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function readJson(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return { rawResponse: text.slice(0, 1000) };
    }
}

function facebookConfig() {
    const configuredVersion = String(
        process.env.FACEBOOK_GRAPH_VERSION || DEFAULT_FACEBOOK_GRAPH_VERSION
    ).trim();

    return {
        enabled:
            String(process.env.FACEBOOK_PUBLISH_ENABLED).toLowerCase() === "true",
        pageId: String(process.env.FACEBOOK_PAGE_ID || "").trim(),
        pageToken: String(
            process.env.FACEBOOK_PAGE_ACCESS_TOKEN || ""
        ).trim(),
        version: configuredVersion.startsWith("v")
            ? configuredVersion
            : `v${configuredVersion}`,
    };
}

function requireFacebookConfig() {
    const config = facebookConfig();

    if (!config.enabled) {
        throw new AppError("Facebook publishing is disabled", 409);
    }

    if (!config.pageId || !config.pageToken) {
        throw new AppError(
            "Facebook Page ID or Page access token is not configured",
            503
        );
    }

    return config;
}

function facebookErrorMessage(payload, fallback) {
    const error = payload?.error;

    if (!error) {
        return fallback;
    }

    return [
        error.message,
        error.code ? `code ${error.code}` : null,
        error.error_subcode ? `subcode ${error.error_subcode}` : null,
    ]
        .filter(Boolean)
        .join(" · ");
}

function linkedinConfig() {
    const target = String(
        process.env.LINKEDIN_PUBLISH_TARGET || "PERSONAL"
    )
        .trim()
        .toUpperCase();

    const memberId = String(process.env.LINKEDIN_MEMBER_ID || "").trim();
    const organizationId = String(
        process.env.LINKEDIN_ORGANIZATION_ID || ""
    ).trim();

    const authorUrn =
        target === "PERSONAL"
            ? `urn:li:person:${memberId}`
            : `urn:li:organization:${organizationId}`;

    return {
        enabled:
            String(process.env.LINKEDIN_PUBLISH_ENABLED).toLowerCase() ===
            "true",
        accessToken: String(
            process.env.LINKEDIN_ACCESS_TOKEN || ""
        ).trim(),
        memberId,
        organizationId,
        target,
        authorUrn,
        version: String(
            process.env.LINKEDIN_VERSION || DEFAULT_LINKEDIN_VERSION
        ).trim(),
    };
}

function requireLinkedinConfig() {
    const config = linkedinConfig();

    if (!config.enabled) {
        throw new AppError("LinkedIn publishing is disabled", 409);
    }

    if (!config.accessToken) {
        throw new AppError("LINKEDIN_ACCESS_TOKEN is not configured", 503);
    }

    if (!["PERSONAL", "ORGANIZATION"].includes(config.target)) {
        throw new AppError(
            "LINKEDIN_PUBLISH_TARGET must be PERSONAL or ORGANIZATION",
            500
        );
    }

    if (config.target === "PERSONAL" && !config.memberId) {
        throw new AppError(
            "LINKEDIN_MEMBER_ID is required for PERSONAL publishing",
            503
        );
    }

    if (config.target === "ORGANIZATION" && !config.organizationId) {
        throw new AppError(
            "LINKEDIN_ORGANIZATION_ID is required for ORGANIZATION publishing",
            503
        );
    }

    if (
        config.target === "ORGANIZATION" &&
        !/^\d+$/.test(config.organizationId)
    ) {
        throw new AppError(
            "LINKEDIN_ORGANIZATION_ID must contain only the numeric organization ID",
            500
        );
    }

    if (!/^\d{6}$/.test(config.version)) {
        throw new AppError(
            "LINKEDIN_VERSION must use YYYYMM format",
            500
        );
    }

    return config;
}

function linkedinHeaders(config, includeContentType = true) {
    const headers = {
        Authorization: `Bearer ${config.accessToken}`,
        "Linkedin-Version": config.version,
        "X-Restli-Protocol-Version": "2.0.0",
    };

    if (includeContentType) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function linkedinErrorMessage(payload, fallback) {
    return String(
        payload?.message ||
        payload?.error_description ||
        payload?.errorDetailType ||
        payload?.serviceErrorCode ||
        payload?.status ||
        fallback
    );
}

function linkedInPostUrl(postUrn) {
    if (!postUrn) {
        return null;
    }

    const encodedUrn = encodeURIComponent(String(postUrn));
    return `https://www.linkedin.com/feed/update/${encodedUrn}/`;
}

async function publishTelegram(post) {
    if (
        String(process.env.TELEGRAM_PUBLISH_ENABLED).toLowerCase() !== "true"
    ) {
        throw new AppError("Telegram publishing is disabled", 409);
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const channel = process.env.TELEGRAM_CHANNEL_ID;

    if (!token || !channel) {
        throw new AppError("Telegram configuration is missing", 503);
    }

    const text = contentFor(post, "TELEGRAM");

    if (!text) {
        throw new AppError("Telegram content is empty", 400);
    }

    if (text.length > 4096) {
        throw new AppError(
            "Telegram content exceeds 4096 characters",
            400
        );
    }

    const response = await fetchWithTimeout(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: channel,
                text,
                disable_web_page_preview: false,
            }),
        }
    );

    const data = await readJson(response);

    if (!response.ok || !data.ok) {
        throw new AppError(
            data.description || "Telegram publishing failed",
            502
        );
    }

    return {
        destination: channel,
        externalMessageId: String(data.result.message_id),
        responseData: {
            chatId: data.result.chat?.id,
            channelUsername: data.result.chat?.username || null,
        },
    };
}

async function testFacebookConnection() {
    const config = requireFacebookConfig();

    const url = new URL(
        `https://graph.facebook.com/${config.version}/${config.pageId}`
    );
    url.searchParams.set("fields", "id,name");
    url.searchParams.set("access_token", config.pageToken);

    const response = await fetchWithTimeout(url);
    const payload = await readJson(response);

    if (!response.ok || payload.error) {
        throw new AppError(
            facebookErrorMessage(
                payload,
                "Facebook connection test failed"
            ),
            response.status >= 400 ? response.status : 502
        );
    }

    return {
        connected: true,
        platform: "FACEBOOK",
        pageId: payload.id,
        pageName: payload.name,
        graphVersion: config.version,
    };
}

async function publishFacebook(post) {
    const config = requireFacebookConfig();
    const message = contentFor(post, "FACEBOOK");

    if (!message) {
        throw new AppError("Facebook content is empty", 400);
    }

    const body = new URLSearchParams();
    body.set("message", message);
    body.set("access_token", config.pageToken);

    const response = await fetchWithTimeout(
        `https://graph.facebook.com/${config.version}/${config.pageId}/feed`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        }
    );

    const payload = await readJson(response);

    if (!response.ok || payload.error || !payload.id) {
        throw new AppError(
            facebookErrorMessage(payload, "Facebook publishing failed"),
            response.status >= 400 ? response.status : 502
        );
    }

    return {
        destination: config.pageId,
        externalMessageId: String(payload.id),
        responseData: {
            pageId: config.pageId,
            facebookPostId: payload.id,
            graphVersion: config.version,
        },
    };
}

async function testLinkedinConnection() {
    const config = requireLinkedinConfig();

    const response = await fetchWithTimeout(
        "https://api.linkedin.com/v2/userinfo",
        {
            method: "GET",
            headers: linkedinHeaders(config, false),
        }
    );

    const payload = await readJson(response);

    if (!response.ok) {
        throw new AppError(
            linkedinErrorMessage(
                payload,
                "LinkedIn connection test failed"
            ),
            response.status >= 400 ? response.status : 502
        );
    }

    const authenticatedMemberId = String(payload.sub || "").trim() || null;
    const configuredMemberMatches =
        config.target !== "PERSONAL" ||
        !authenticatedMemberId ||
        authenticatedMemberId === config.memberId;

    if (!configuredMemberMatches) {
        throw new AppError(
            "LINKEDIN_MEMBER_ID does not match the authenticated LinkedIn account",
            409
        );
    }

    return {
        connected: true,
        platform: "LINKEDIN",
        publishTarget: config.target,
        authorUrn: config.authorUrn,
        memberId:
            config.target === "PERSONAL" ? config.memberId : null,
        organizationId:
            config.target === "ORGANIZATION"
                ? config.organizationId
                : null,
        authenticatedMemberId,
        name: payload.name || null,
        givenName: payload.given_name || null,
        familyName: payload.family_name || null,
        email: payload.email || null,
        linkedinVersion: config.version,
    };
}
async function publishLinkedin(post) {
    const config = requireLinkedinConfig();

    const commentary = linkedinSafeContent(
        contentFor(post, "LINKEDIN")
    );

    if (!commentary) {
        throw new AppError("LinkedIn content is empty", 400);
    }

    const requestBody = {
        author: config.authorUrn,
        commentary,
        visibility: "PUBLIC",
        distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
    };

    console.log("========== LINKEDIN COMMENTARY ==========");
    console.log(commentary);
    console.log("Characters:", commentary.length);

    console.log("========== LINKEDIN REQUEST ==========");
    console.log(JSON.stringify(requestBody, null, 2));

    const response = await fetchWithTimeout(
        "https://api.linkedin.com/rest/posts",
        {
            method: "POST",
            headers: linkedinHeaders(config),
            body: JSON.stringify(requestBody),
        }
    );

    const payload = await readJson(response);
    const postUrn =
        response.headers.get("x-restli-id") ||
        payload.id ||
        null;

    if (response.status !== 201 || !postUrn) {
        throw new AppError(
            linkedinErrorMessage(
                payload,
                "LinkedIn publishing failed"
            ),
            response.status >= 400 ? response.status : 502
        );
    }

    return {
        destination:
            config.target === "PERSONAL"
                ? config.memberId
                : config.organizationId,
        externalMessageId: String(postUrn),
        responseData: {
            publishTarget: config.target,
            authorUrn: config.authorUrn,
            linkedinPostUrn: String(postUrn),
            linkedinPostUrl: linkedInPostUrl(postUrn),
            linkedinVersion: config.version,
        },
    };
}
async function publishToPlatform(platform, post) {
    switch (platform) {
        case "TELEGRAM":
            return publishTelegram(post);
        case "FACEBOOK":
            return publishFacebook(post);
        case "LINKEDIN":
            return publishLinkedin(post);
        case "INSTAGRAM":
            return publishInstagram(post);
        case "X":
        case "YOUTUBE":
        case "WHATSAPP":
            throw new AppError(
                `${platform} publisher is not configured yet`,
                501
            );
        default:
            throw new AppError(
                `Unsupported platform: ${platform}`,
                400
            );
    }
}

module.exports = {
    enabledPlatforms,
    publishToPlatform,
    testFacebookConnection,
    testLinkedinConnection,
};
