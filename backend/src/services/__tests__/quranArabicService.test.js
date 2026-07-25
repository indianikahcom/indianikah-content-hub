const test = require("node:test");
const assert = require("node:assert/strict");
const {
    expandReference,
    fetchArabicByReference,
} = require("../quranArabicService");

test("expands a single Quran reference", () => {
    assert.deepEqual(expandReference("2:187"), [
        { surah: 2, ayah: 187, key: "2:187" },
    ]);
});

test("expands a Quran verse range", () => {
    assert.deepEqual(expandReference("4:128-130"), [
        { surah: 4, ayah: 128, key: "4:128" },
        { surah: 4, ayah: 129, key: "4:129" },
        { surah: 4, ayah: 130, key: "4:130" },
    ]);
});

test("rejects malformed or excessive ranges", () => {
    assert.throws(() => expandReference("not-a-reference"));
    assert.throws(() => expandReference("2:230-226"));
    assert.throws(() => expandReference("2:1-40"));
});

test("retrieves verified Arabic and English translation", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (url) => {
        const isArabic = String(url).endsWith("/quran-uthmani");
        return {
            ok: true,
            json: async () => ({
                code: 200,
                data: {
                    text: isArabic ? "نَصٌّ عَرَبِيٌّ" : "Verified translation",
                    numberInSurah: 1,
                    surah: { number: 65 },
                    edition: {
                        identifier: isArabic
                            ? "quran-uthmani"
                            : "en.sahih",
                        englishName: isArabic
                            ? "Uthmani"
                            : "Saheeh International",
                    },
                },
            }),
        };
    };

    try {
        const result = await fetchArabicByReference("65:1");
        assert.equal(result.text, "نَصٌّ عَرَبِيٌّ");
        assert.equal(result.translation, "[65:1] Verified translation");
        assert.equal(result.translationName, "Saheeh International");
    } finally {
        global.fetch = originalFetch;
    }
});
