const { requestJson } = require("./httpClient");

function ensureConfig() {
    if (!process.env.LINKEDIN_ACCESS_TOKEN) {
        throw new Error("LINKEDIN_ACCESS_TOKEN is not configured");
    }
    if (!process.env.LINKEDIN_AUTHOR_URN) {
        throw new Error("LINKEDIN_AUTHOR_URN is not configured");
    }
}

async function publish({ content }) {
    ensureConfig();

    const data = await requestJson(
        "https://api.linkedin.com/v2/ugcPosts",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify({
                author: process.env.LINKEDIN_AUTHOR_URN,
                lifecycleState: "PUBLISHED",
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: content,
                        },
                        shareMediaCategory: "NONE",
                    },
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility":
                        "PUBLIC",
                },
            }),
        }
    );

    const externalId = String(data?.id || "");

    return {
        externalId,
        liveUrl: null,
        raw: data,
    };
}

module.exports = { publish };
