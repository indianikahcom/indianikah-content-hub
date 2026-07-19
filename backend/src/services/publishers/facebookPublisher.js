const { requestJson } = require("./httpClient");

function ensureConfig() {
    if (!process.env.FACEBOOK_PAGE_ID) {
        throw new Error("FACEBOOK_PAGE_ID is not configured");
    }
    if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
        throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is not configured");
    }
}

async function publish({ content }) {
    ensureConfig();

    const version = process.env.FACEBOOK_GRAPH_VERSION || "v23.0";
    const url = new URL(
        `https://graph.facebook.com/${version}/${process.env.FACEBOOK_PAGE_ID}/feed`
    );

    url.searchParams.set("message", content);
    url.searchParams.set(
        "access_token",
        process.env.FACEBOOK_PAGE_ACCESS_TOKEN
    );

    const data = await requestJson(url, { method: "POST" });
    const externalId = String(data?.id || "");

    return {
        externalId,
        liveUrl: externalId
            ? `https://www.facebook.com/${externalId}`
            : null,
        raw: data,
    };
}

module.exports = { publish };
