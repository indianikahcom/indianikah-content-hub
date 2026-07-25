const test = require("node:test");
const assert = require("node:assert/strict");
const {
    buildFacebookPostUrl,
    splitFacebookPostId,
} = require("../facebookPostUrl");

test("builds a mobile-safe permalink from a compound Graph post ID", () => {
    assert.equal(
        buildFacebookPostUrl("123456_987654"),
        "https://www.facebook.com/permalink.php?story_fbid=987654&id=123456"
    );
});

test("uses the page ID when Facebook returns only the story ID", () => {
    assert.equal(
        buildFacebookPostUrl("987654", "123456"),
        "https://www.facebook.com/permalink.php?story_fbid=987654&id=123456"
    );
});

test("does not invent a link when the page ID is unavailable", () => {
    assert.equal(buildFacebookPostUrl("987654"), null);
    assert.deepEqual(splitFacebookPostId("", "123456"), {
        pageId: "123456",
        postId: null,
    });
});
