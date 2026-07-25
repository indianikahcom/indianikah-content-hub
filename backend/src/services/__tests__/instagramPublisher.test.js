const test = require("node:test");
const assert = require("node:assert/strict");
const {
    captionWithHashtags,
} = require("../publishers/instagramPublisher");

test("adds relevant Instagram hashtags without duplicating existing tags", () => {
    const caption = captionWithHashtags(
        "Marriage guidance for families.\n\n#IndiaNikah #Nikah"
    );

    assert.match(caption, /#MuslimMatrimony/);
    assert.match(caption, /#MarriageInIslam/);
    assert.match(caption, /#FreeMatrimony/);
    assert.equal(
        (caption.match(/#IndiaNikah/g) || []).length,
        1
    );
    assert.ok(caption.length <= 2200);
});

test("reserves caption space for hashtags when content is long", () => {
    const caption = captionWithHashtags("a".repeat(2200));

    assert.ok(caption.length <= 2200);
    assert.match(caption, /#IndiaNikah/);
    assert.match(caption, /#MarriageGoals$/);
});
