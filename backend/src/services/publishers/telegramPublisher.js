const { requestJson } = require("./httpClient");

function ensureConfig() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }
    if (!process.env.TELEGRAM_CHAT_ID) {
        throw new Error("TELEGRAM_CHAT_ID is not configured");
    }
}

async function publish({ content }) {
    ensureConfig();

    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const data = await requestJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: content,
            parse_mode: "HTML",
            disable_web_page_preview: false,
        }),
    });

    const username = String(
        process.env.TELEGRAM_CHANNEL_USERNAME || ""
    ).replace(/^@/, "");

    return {
        externalId: String(data?.result?.message_id || ""),
        liveUrl:
            username && data?.result?.message_id
                ? `https://t.me/${username}/${data.result.message_id}`
                : null,
        raw: data,
    };
}

module.exports = { publish };
