const telegramPublisher = require("./publishers/telegramPublisher");

/**
 * Backward-compatible Telegram publisher adapter.
 *
 * The unified publishing pipeline uses publish({ content }), while the
 * legacy publication service still calls publishTextPost(post). Keeping this
 * adapter prevents duplicate Telegram implementations and lets both routes
 * use the same HTTP client and environment configuration.
 */
async function publishTextPost(post) {
    const result = await telegramPublisher.publish({
        title: post?.title || null,
        content: post?.content || "",
    });

    return {
        messageId: result.externalId || null,
        chatId:
            process.env.TELEGRAM_CHAT_ID ||
            process.env.TELEGRAM_CHANNEL_ID ||
            null,
        channelUsername: String(
            process.env.TELEGRAM_CHANNEL_USERNAME || ""
        ).replace(/^@/, "") || null,
        liveUrl: result.liveUrl || null,
        raw: result.raw || null,
    };
}

module.exports = {
    publish: telegramPublisher.publish,
    publishTextPost,
};
