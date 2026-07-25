const test = require("node:test");
const assert = require("node:assert/strict");
const {
    englishOnly,
    postText,
    weightedLength,
} = require("../publishers/xPublisher");

test("keeps X posts within the weighted limit and adds branding", () => {
    const result = postText(
        `IndiaNikah\n\n${"marriage ".repeat(50)}`
    );

    assert.ok(weightedLength(result) <= 280);
    assert.match(result, /^IndiaNikah\n\nmarriage/);
    assert.match(
        result,
        /IndiaNikah\.com - 100% free forever\.\n#IndiaNikah #Nikah$/
    );
});

test("removes non-English scripts and duplicate branding", () => {
    const result = postText(
        "Marriage with kindness.\nرَبَّنَا هَبْ لَنَا\n" +
        "https://example.com\nIndiaNikah.com - 100% free forever. #IndiaNikah"
    );

    assert.equal(
        result,
        "Marriage with kindness.\n\n" +
        "IndiaNikah.com - 100% free forever.\n#IndiaNikah #Nikah"
    );
    assert.equal(englishOnly("Nikah विवाह نکاح"), "Nikah");
});
