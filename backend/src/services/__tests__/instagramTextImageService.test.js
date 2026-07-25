const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const sharp = require("sharp");
const {
    generateInstagramTextImage,
    imageLines,
    svgFor,
} = require("../instagramTextImageService");

test("limits text-card content to the available layout", () => {
    const lines = imageLines({
        content: Array.from(
            { length: 100 },
            (_, index) => `word${index}`
        ).join(" "),
    });

    assert.ok(lines.length <= 10);
});

test("includes IndiaNikah branding, engagement cues, and WhatsApp contact", () => {
    const svg = svgFor(
        {
            title: "Marriage guidance",
            content: "Build a marriage with trust and kindness.",
        },
        {
            whatsappNumber: "918482833177",
            websiteUrl: "https://www.indianikah.com",
        }
    ).toString();

    assert.match(svg, /IndiaNikah\.com/);
    assert.match(svg, /data:image\/png;base64,/);
    assert.match(svg, /100% FREE • PRIVACY FIRST/);
    assert.match(svg, /SAVE  •  SHARE  •  FOLLOW/);
    assert.match(svg, /Find your match — Link in bio/);
    assert.match(svg, /\+91 84828 33177/);
    assert.match(svg, /<path d="M/);
});

test("renders a 1080 by 1350 JPEG with Arabic text", async () => {
    const outputDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), "indianikah-instagram-")
    );
    const previousDirectory =
        process.env.INSTAGRAM_MEDIA_OUTPUT_DIR;
    const previousBase =
        process.env.INSTAGRAM_MEDIA_PUBLIC_BASE_URL;

    process.env.INSTAGRAM_MEDIA_OUTPUT_DIR =
        outputDirectory;
    process.env.INSTAGRAM_MEDIA_PUBLIC_BASE_URL =
        "https://example.com/generated-media";

    try {
        const result = await generateInstagramTextImage({
            id: 123,
            title: "Dua for marriage",
            content:
                "Arabic Dua:\n\u0631\u064e\u0628\u064e\u0651\u0646\u064e\u0627 \u0647\u064e\u0628\u0652 \u0644\u064e\u0646\u064e\u0627\n\nEnglish translation:\nOur Lord, grant us goodness.",
        });
        const metadata = await sharp(result.filePath).metadata();

        assert.equal(metadata.format, "jpeg");
        assert.equal(metadata.width, 1080);
        assert.equal(metadata.height, 1350);
        assert.match(result.publicUrl, /^https:\/\//);
    } finally {
        if (previousDirectory === undefined) {
            delete process.env.INSTAGRAM_MEDIA_OUTPUT_DIR;
        } else {
            process.env.INSTAGRAM_MEDIA_OUTPUT_DIR =
                previousDirectory;
        }
        if (previousBase === undefined) {
            delete process.env.INSTAGRAM_MEDIA_PUBLIC_BASE_URL;
        } else {
            process.env.INSTAGRAM_MEDIA_PUBLIC_BASE_URL =
                previousBase;
        }
        await fs.rm(outputDirectory, {
            recursive: true,
            force: true,
        });
    }
});
