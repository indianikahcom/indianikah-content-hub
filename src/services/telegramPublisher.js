const AppError = require("../errors/AppError");

const TELEGRAM_MESSAGE_LIMIT = 4096;

function getTelegramConfig() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    const enabled = String(process.env.TELEGRAM_PUBLISH_ENABLED).toLowerCase() === "true";

    if (!enabled) {
        throw new AppError("Telegram publishing is disabled", 503);
    }

    if (!token || !channelId) {
        throw new AppError("Telegram publishing configuration is incomplete", 503);
    }

    return { token, channelId };
}

function buildMessage(post) {
    const title = String(post.title || "").trim();
    const content = String(post.content || "").trim();
    const message = [title, content].filter(Boolean).join("\n\n");

    if (!message) {
        throw new AppError("Post has no publishable content", 400);
    }

    if (message.length > TELEGRAM_MESSAGE_LIMIT) {
        throw new AppError(
            `Telegram message exceeds ${TELEGRAM_MESSAGE_LIMIT} characters`,
            400,
            { currentLength: message.length, maximumLength: TELEGRAM_MESSAGE_LIMIT }
        );
    }

    return message;
}

async function publishTextPost(post) {
    const { token, channelId } = getTelegramConfig();
    const text = buildMessage(post);

    let response;
    let payload;

    try {
        response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: channelId,
                text
            })
        });

        payload = await response.json();
    } catch (error) {
        throw new AppError(`Telegram request failed: ${error.message}`, 502);
    }

    if (!response.ok || !payload.ok) {
        throw new AppError(
            payload.description || "Telegram publishing failed",
            502,
            payload
        );
    }

    return {
        messageId: payload.result.message_id,
        chatId: payload.result.chat?.id,
        channelUsername: payload.result.chat?.username || null,
        raw: payload
    };
}

module.exports = {
    publishTextPost,
    TELEGRAM_MESSAGE_LIMIT
};
