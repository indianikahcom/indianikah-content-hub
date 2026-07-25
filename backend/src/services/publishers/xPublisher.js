const crypto = require("crypto");
const AppError = require("../../errors/AppError");

const MAX_POST_LENGTH = 280;
const X_URL_LENGTH = 23;
const X_BRAND_BLOCK =
    "IndiaNikah.com - 100% free forever.\n" +
    "#IndiaNikah #Nikah";

function config() {
    return {
        enabled:
            String(process.env.X_PUBLISH_ENABLED).toLowerCase() ===
            "true",
        apiKey: String(process.env.X_API_KEY || "").trim(),
        apiSecret: String(process.env.X_API_SECRET || "").trim(),
        accessToken: String(
            process.env.X_ACCESS_TOKEN || ""
        ).trim(),
        accessTokenSecret: String(
            process.env.X_ACCESS_TOKEN_SECRET || ""
        ).trim(),
        username: String(process.env.X_USERNAME || "")
            .trim()
            .replace(/^@/, ""),
    };
}

function requireConfig() {
    const value = config();
    if (!value.enabled) {
        throw new AppError("X publishing is disabled", 409);
    }
    if (
        !value.apiKey ||
        !value.apiSecret ||
        !value.accessToken ||
        !value.accessTokenSecret
    ) {
        throw new AppError(
            "Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET",
            503
        );
    }
    return value;
}

function encode(value) {
    return encodeURIComponent(String(value)).replace(
        /[!'()*]/g,
        (character) =>
            `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );
}

function authorizationHeader(
    method,
    requestUrl,
    value,
    query = {}
) {
    const oauth = {
        oauth_consumer_key: value.apiKey,
        oauth_nonce: crypto.randomBytes(18).toString("hex"),
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: String(Math.floor(Date.now() / 1000)),
        oauth_token: value.accessToken,
        oauth_version: "1.0",
    };
    const parameters = Object.entries({
        ...query,
        ...oauth,
    })
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => `${encode(key)}=${encode(item)}`)
        .join("&");
    const signatureBase = [
        method.toUpperCase(),
        encode(requestUrl),
        encode(parameters),
    ].join("&");
    const signingKey =
        `${encode(value.apiSecret)}&` +
        encode(value.accessTokenSecret);
    oauth.oauth_signature = crypto
        .createHmac("sha1", signingKey)
        .update(signatureBase)
        .digest("base64");

    return (
        "OAuth " +
        Object.entries(oauth)
            .sort(([left], [right]) =>
                left.localeCompare(right)
            )
            .map(
                ([key, item]) =>
                    `${encode(key)}="${encode(item)}"`
            )
            .join(", ")
    );
}

function englishOnly(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7E\n]/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/ *\n */g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function weightedLength(value) {
    const text = String(value);
    const urlPattern =
        /(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+(?:com|org|net|in)\b(?:\/\S*)?/gi;
    let length = 0;
    let cursor = 0;

    for (const match of text.matchAll(urlPattern)) {
        length += match.index - cursor;
        length += X_URL_LENGTH;
        cursor = match.index + match[0].length;
    }
    return length + text.length - cursor;
}

function truncateWeighted(value, limit) {
    if (weightedLength(value) <= limit) return value;

    let result = "";
    for (const character of value) {
        const candidate = `${result}${character}`;
        if (weightedLength(candidate) > limit - 3) break;
        result = candidate;
    }
    return `${result.trim()}...`;
}

function postText(content) {
    const value = englishOnly(content)
        .replace(/https?:\/\/\S+/gi, "")
        .replace(
            /IndiaNikah(?:\.com)?\s*-\s*100%\s*free\s*forever\.?/gi,
            ""
        )
        .replace(/(?:www\.)?indianikah\.com(?:\/\S*)?/gi, "")
        .replace(/#IndiaNikah|#Nikah/gi, "")
        .replace(/[ \t]+/g, " ")
        .replace(/ *\n */g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    const separator = value ? "\n\n" : "";
    const available =
        MAX_POST_LENGTH -
        weightedLength(separator) -
        weightedLength(X_BRAND_BLOCK);
    const body = truncateWeighted(value, available);

    return `${body}${body ? separator : ""}${X_BRAND_BLOCK}`;
}

async function xRequest(
    method,
    requestUrl,
    value,
    { query = {}, body } = {}
) {
    const url = new URL(requestUrl);
    for (const [key, item] of Object.entries(query)) {
        url.searchParams.set(key, item);
    }
    const response = await fetch(url, {
        method,
        headers: {
            Authorization: authorizationHeader(
                method,
                requestUrl,
                value,
                query
            ),
            ...(body
                ? { "Content-Type": "application/json" }
                : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new AppError(
            `X API request failed: ${payload.detail || payload.title || payload.errors?.[0]?.message || response.status}`,
            response.status >= 500 ? 502 : 400
        );
    }
    return payload;
}

async function publish({ content }) {
    const value = requireConfig();
    const payload = await xRequest(
        "POST",
        "https://api.x.com/2/tweets",
        value,
        {
            body: {
                text: postText(content),
            },
        }
    );
    const externalId = String(payload.data?.id || "");
    const liveUrl =
        externalId && value.username
            ? `https://x.com/${value.username}/status/${externalId}`
            : null;

    return {
        externalId,
        liveUrl,
        raw: payload,
    };
}

async function testConnection() {
    const value = requireConfig();
    const payload = await xRequest(
        "GET",
        "https://api.x.com/2/users/me",
        value,
        {
            query: {
                "user.fields": "id,name,username",
            },
        }
    );
    return {
        connected: true,
        platform: "X",
        userId: payload.data?.id || null,
        username: payload.data?.username || null,
        name: payload.data?.name || null,
    };
}

module.exports = {
    englishOnly,
    postText,
    publish,
    testConnection,
    weightedLength,
};
