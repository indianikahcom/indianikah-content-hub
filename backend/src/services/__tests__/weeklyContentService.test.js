const test = require("node:test");
const assert = require("node:assert/strict");
const {
    WEEKLY_TYPES,
    DATABASE_SOURCE_TYPES,
    indiaWeekday,
} = require("../weeklyContentService");

test("maps the weekly schedule to the expected content types", () => {
    assert.deepEqual(WEEKLY_TYPES, {
        0: "DUA",
        1: "NEWS",
        2: "BLOG",
        3: "BOOK",
        4: "VIDEO",
        5: "QURAN",
        6: "HADITH",
    });
});

test("uses production database sources for news, blogs, books, and videos", () => {
    assert.deepEqual(DATABASE_SOURCE_TYPES, {
        NEWS: "BLOG",
        BLOG: "BLOG",
        BOOK: "BOOK",
        VIDEO: "GUIDELINE",
    });
});

test("calculates weekdays in Asia/Kolkata", () => {
    assert.equal(indiaWeekday(new Date("2026-07-27T15:00:00Z")), 1);
    assert.equal(indiaWeekday(new Date("2026-07-30T15:00:00Z")), 4);
});
