const { requestJson } = require("./httpClient");

function ensureConfig() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }
    if (!process.env.TELEGRAM_CHAT_ID) {
        throw new Error("TELEGRAM_CHAT_ID is not configured");
    }
}

function telegramPostUrl({ username, chatId, messageId }) {
    const normalizedMessageId = String(messageId || "").trim();
    const normalizedUsername = String(username || "")
        .trim()
        .replace(/^@/, "");

    if (!normalizedMessageId) {
        return null;
    }

    if (normalizedUsername) {
        return `https://t.me/${normalizedUsername}/${normalizedMessageId}`;
    }

    const normalizedChatId = String(chatId || "").trim();
    if (/^-100\d+$/.test(normalizedChatId)) {
        return `https://t.me/c/${normalizedChatId.slice(4)}/${normalizedMessageId}`;
    }

    return null;
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

    const messageId = data?.result?.message_id;
    const username =
        process.env.TELEGRAM_CHANNEL_USERNAME ||
        data?.result?.chat?.username;
    const chatId =
        data?.result?.chat?.id ||
        process.env.TELEGRAM_CHAT_ID;

    return {
        externalId: String(messageId || ""),
        liveUrl: telegramPostUrl({
            username,
            chatId,
            messageId,
        }),
        raw: data,
    };
}

module.exports = { publish, telegramPostUrl };
