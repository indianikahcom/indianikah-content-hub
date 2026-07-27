const test = require("node:test");
const assert = require("node:assert/strict");
const {
    isPublishedStatus,
} = require("../randomSourceRepository");

test("recognizes legacy and modern successful publication statuses", () => {
    assert.equal(isPublishedStatus("SUCCESS"), true);
    assert.equal(isPublishedStatus("PUBLISHED"), true);
    assert.equal(isPublishedStatus("published"), true);
    assert.equal(isPublishedStatus("FAILED"), false);
    assert.equal(isPublishedStatus(null), false);
});
