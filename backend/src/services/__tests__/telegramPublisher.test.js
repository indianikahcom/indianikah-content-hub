const test = require("node:test");
const assert = require("node:assert/strict");
const {
    telegramPostUrl,
} = require("../publishers/telegramPublisher");

test("builds a public Telegram channel post URL", () => {
    assert.equal(
        telegramPostUrl({
            username: "@IndiaNikah",
            chatId: "-1001234567890",
            messageId: 319,
        }),
        "https://t.me/IndiaNikah/319"
    );
});

test("builds a private channel post URL from a supergroup chat ID", () => {
    assert.equal(
        telegramPostUrl({
            chatId: "-1001234567890",
            messageId: 319,
        }),
        "https://t.me/c/1234567890/319"
    );
});

test("returns no URL without a message ID or addressable channel", () => {
    assert.equal(
        telegramPostUrl({ username: "IndiaNikah" }),
        null
    );
    assert.equal(
        telegramPostUrl({ chatId: "12345", messageId: 319 }),
        null
    );
});
