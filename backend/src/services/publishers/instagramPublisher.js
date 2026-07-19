const { requestJson } = require("./httpClient");

function ensureConfig() {
    if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
        throw new Error(
            "INSTAGRAM_BUSINESS_ACCOUNT_ID is not configured"
        );
    }
    if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
        throw new Error(
            "FACEBOOK_PAGE_ACCESS_TOKEN is not configured"
        );
    }
    if (!process.env.INSTAGRAM_DEFAULT_IMAGE_URL) {
        throw new Error(
            "INSTAGRAM_DEFAULT_IMAGE_URL is not configured"
        );
    }
}

async function publish({ content, imageUrl }) {
    ensureConfig();

    const version = process.env.FACEBOOK_GRAPH_VERSION || "v23.0";
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const mediaUrl =
        imageUrl || process.env.INSTAGRAM_DEFAULT_IMAGE_URL;

    const containerUrl = new URL(
        `https://graph.facebook.com/${version}/${accountId}/media`
    );
    containerUrl.searchParams.set("image_url", mediaUrl);
    containerUrl.searchParams.set("caption", content);
    containerUrl.searchParams.set("access_token", token);

    const container = await requestJson(containerUrl, {
        method: "POST",
    });

    const publishUrl = new URL(
        `https://graph.facebook.com/${version}/${accountId}/media_publish`
    );
    publishUrl.searchParams.set(
        "creation_id",
        String(container.id)
    );
    publishUrl.searchParams.set("access_token", token);

    const result = await requestJson(publishUrl, {
        method: "POST",
    });

    const externalId = String(result?.id || "");

    return {
        externalId,
        liveUrl: externalId
            ? `https://www.instagram.com/p/${externalId}/`
            : null,
        raw: {
            container,
            publication: result,
        },
    };
}

module.exports = { publish };
