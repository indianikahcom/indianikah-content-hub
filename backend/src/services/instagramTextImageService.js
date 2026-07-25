const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const QRCode = require("qrcode");
const AppError = require("../errors/AppError");

const WIDTH = 1080;
const HEIGHT = 1350;
const DESIGN_VERSION = "brand-v5-large-qr";
const DEFAULT_WHATSAPP_NUMBER = "918482833177";
const DEFAULT_WEBSITE_URL = "https://www.indianikah.com";
const LOGO_DATA = fsSync
    .readFileSync(
        path.join(
            __dirname,
            "../assets/indianikah-logo-white.png"
        )
    )
    .toString("base64");
const ARABIC_FONT_DATA = fsSync
    .readFileSync(
        require.resolve(
            "@expo-google-fonts/noto-naskh-arabic/400Regular/NotoNaskhArabic_400Regular.ttf"
        )
    )
    .toString("base64");

function config() {
    const publicBaseUrl = String(
        process.env.INSTAGRAM_MEDIA_PUBLIC_BASE_URL ||
        process.env.AI_IMAGE_PUBLIC_BASE_URL ||
        "https://server.indianikah.com/generated-media"
    ).trim().replace(/\/$/, "");

    return {
        publicBaseUrl,
        whatsappNumber: String(
            process.env.INDIANIKAH_WHATSAPP_NUMBER ||
            DEFAULT_WHATSAPP_NUMBER
        ).replace(/\D/g, ""),
        websiteUrl: String(
            process.env.INDIANIKAH_WEBSITE_URL ||
            DEFAULT_WEBSITE_URL
        ).trim(),
        outputDirectory: path.resolve(
            process.cwd(),
            process.env.INSTAGRAM_MEDIA_OUTPUT_DIR ||
            "public/generated-media"
        ),
    };
}

function requireConfig() {
    const value = config();

    if (
        !/^https:\/\//i.test(value.publicBaseUrl) ||
        !/\/generated-media$/i.test(value.publicBaseUrl)
    ) {
        throw new AppError(
            "INSTAGRAM_MEDIA_PUBLIC_BASE_URL must be a public HTTPS URL ending at /generated-media",
            503
        );
    }

    return value;
}

function xmlEscape(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function normalizeText(value) {
    return String(value || "")
        .replace(/\r/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function visibleText(post) {
    const variant = (post?.variants || []).find(
        (item) =>
            String(item.platform || "").toUpperCase() === "INSTAGRAM"
    );
    const content = normalizeText(variant?.content || post?.content);
    const paragraphs = content
        .split(/\n{2,}/)
        .map((value) => value.trim())
        .filter(Boolean)
        .filter(
            (value) =>
                !/^source reference:/i.test(value) &&
                !/^indianikah\.com/i.test(value) &&
                !/^find your compatible match:/i.test(value)
        );

    return paragraphs.slice(0, 4).join("\n\n");
}

function isArabic(value) {
    return /[\u0600-\u06FF]/u.test(String(value || ""));
}

function wrapParagraph(value, maxLatin = 38, maxArabic = 30) {
    const max = isArabic(value) ? maxArabic : maxLatin;
    const words = String(value).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (candidate.length > max && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function imageLines(post) {
    const paragraphs = visibleText(post).split(/\n+/).filter(Boolean);
    const lines = [];

    for (const paragraph of paragraphs) {
        if (lines.length >= 10) break;
        const wrapped = wrapParagraph(paragraph);
        for (const line of wrapped) {
            if (lines.length >= 10) break;
            lines.push(line);
        }
        if (lines.length < 10) lines.push("");
    }

    while (lines.at(-1) === "") lines.pop();
    return lines;
}

function stableFileName(post, whatsappNumber, websiteUrl) {
    const digest = crypto
        .createHash("sha256")
        .update(
            `${DESIGN_VERSION}|${whatsappNumber}|${websiteUrl}|${post?.id || "draft"}|${post?.updatedAt || ""}|${post?.title || ""}|${visibleText(post)}`
        )
        .digest("hex")
        .slice(0, 14);
    return `instagram-post-${post?.id || "draft"}-${digest}.jpg`;
}

function displayPhone(number) {
    const value = String(number || "").replace(/\D/g, "");
    if (value.length === 12 && value.startsWith("91")) {
        return `+91 ${value.slice(2, 7)} ${value.slice(7)}`;
    }
    return value ? `+${value}` : "";
}

function qrSvg(value, x, y, size) {
    const qr = QRCode.create(value, {
        errorCorrectionLevel: "M",
    });
    const quietZone = 3;
    const gridSize = qr.modules.size + quietZone * 2;
    const moduleSize = size / gridSize;
    const commands = [];

    for (let row = 0; row < qr.modules.size; row += 1) {
        for (let column = 0; column < qr.modules.size; column += 1) {
            if (qr.modules.get(row, column)) {
                const cellX =
                    x + (column + quietZone) * moduleSize;
                const cellY =
                    y + (row + quietZone) * moduleSize;
                commands.push(
                    `M${cellX.toFixed(2)} ${cellY.toFixed(2)}` +
                    `h${moduleSize.toFixed(2)}` +
                    `v${moduleSize.toFixed(2)}` +
                    `h-${moduleSize.toFixed(2)}z`
                );
            }
        }
    }

    return `
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="8" fill="#ffffff"/>
      <path d="${commands.join("")}" fill="#620835"/>
    `;
}

function svgFor(post, options = {}) {
    const whatsappNumber =
        String(
            options.whatsappNumber ||
            process.env.INDIANIKAH_WHATSAPP_NUMBER ||
            DEFAULT_WHATSAPP_NUMBER
        ).replace(/\D/g, "");
    const whatsappLabel = displayPhone(whatsappNumber);
    const websiteUrl = String(
        options.websiteUrl ||
        process.env.INDIANIKAH_WEBSITE_URL ||
        DEFAULT_WEBSITE_URL
    ).trim();
    const websiteQr = qrSvg(websiteUrl, 817, 1165, 146);
    const title = normalizeText(post?.title || "IndiaNikah");
    const titleLines = wrapParagraph(title, 29, 24).slice(0, 3);
    const lines = imageLines(post);
    const titleStart = 292;
    const bodyStart = titleStart + titleLines.length * 64 + 55;
    const titleSvg = titleLines.map(
        (line, index) =>
            `<text x="540" y="${titleStart + index * 64}" text-anchor="middle" direction="${isArabic(line) ? "rtl" : "ltr"}" class="title">${xmlEscape(line)}</text>`
    ).join("");
    const bodySvg = lines.map(
        (line, index) =>
            line
                ? `<text x="540" y="${bodyStart + index * 50}" text-anchor="middle" direction="${isArabic(line) ? "rtl" : "ltr"}" class="body">${xmlEscape(line)}</text>`
                : ""
    ).join("");

    return Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#620835"/>
            <stop offset="55%" stop-color="#ba055a"/>
            <stop offset="100%" stop-color="#df3768"/>
          </linearGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#e7a936"/>
            <stop offset="50%" stop-color="#ffc550"/>
            <stop offset="100%" stop-color="#e7a936"/>
          </linearGradient>
          <linearGradient id="brandAccent" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#df3768"/>
            <stop offset="50%" stop-color="#ff4d94"/>
            <stop offset="100%" stop-color="#ff80b3"/>
          </linearGradient>
          <pattern id="pattern" width="70" height="70" patternUnits="userSpaceOnUse">
            <path d="M35 5 L65 35 L35 65 L5 35 Z" fill="none" stroke="#ffffff" stroke-width="1"/>
            <circle cx="35" cy="35" r="8" fill="none" stroke="#ffffff" stroke-width="1"/>
          </pattern>
          <style>
            @font-face {
              font-family: "Embedded Noto Naskh Arabic";
              src: url("data:font/ttf;base64,${ARABIC_FONT_DATA}") format("truetype");
              font-weight: 400;
              font-style: normal;
            }
            .tagline { font: 400 23px "Arial", "Noto Sans", sans-serif; fill: #d9eee9; }
            .header-badge { font: 700 20px "Arial", "Noto Sans", sans-serif; fill: #620835; letter-spacing: .7px; }
            .trust { font: 700 19px "Arial", "Noto Sans", sans-serif; fill: #7a0338; letter-spacing: .5px; }
            .title { font: 700 46px "Embedded Noto Naskh Arabic", "Arial", sans-serif; fill: #620835; }
            .body { font: 400 32px "Embedded Noto Naskh Arabic", "Arial", sans-serif; fill: #52061f; }
            .engage { font: 700 22px "Arial", "Noto Sans", sans-serif; fill: #ba055a; letter-spacing: 2px; }
            .cta { font: 700 27px "Arial", "Noto Sans", sans-serif; fill: #ffffff; }
            .contact { font: 700 25px "Arial", "Noto Sans", sans-serif; fill: #ffffff; }
            .contact-label { font: 400 18px "Arial", "Noto Sans", sans-serif; fill: #d9eee9; letter-spacing: 1px; }
          </style>
        </defs>
        <rect width="1080" height="1350" fill="url(#background)"/>
        <rect width="1080" height="1350" fill="url(#pattern)" opacity=".055"/>
        <image
          href="data:image/png;base64,${LOGO_DATA}"
          x="58"
          y="20"
          width="460"
          height="137"
          preserveAspectRatio="xMinYMid meet"
        />
        <rect x="730" y="59" width="280" height="48" rx="24" fill="url(#gold)"/>
        <text x="870" y="91" text-anchor="middle" class="header-badge">100% FREE FOREVER</text>

        <rect x="70" y="168" width="940" height="945" rx="42" fill="#fffafc"/>
        <rect x="70" y="168" width="940" height="13" rx="7" fill="url(#brandAccent)"/>
        <rect x="352" y="198" width="376" height="38" rx="19" fill="#ffe6f0"/>
        <text x="540" y="224" text-anchor="middle" class="trust">100% FREE • PRIVACY FIRST</text>
        ${titleSvg}
        ${bodySvg}

        <line x1="150" y1="1014" x2="930" y2="1014" stroke="#ffb3d9" stroke-width="2"/>
        <text x="540" y="1061" text-anchor="middle" class="engage">SAVE  •  SHARE  •  FOLLOW</text>

        <rect x="100" y="1144" width="660" height="62" rx="31" fill="url(#brandAccent)"/>
        <text x="430" y="1185" text-anchor="middle" class="cta">Find your match — Link in bio</text>

        <text x="890" y="1155" text-anchor="middle" class="contact-label">SCAN WEBSITE</text>
        <text x="195" y="1260" text-anchor="middle" class="contact-label">VISIT</text>
        <text x="195" y="1295" text-anchor="middle" class="contact">IndiaNikah.com</text>
        <line x1="380" y1="1242" x2="380" y2="1303" stroke="#ffb3d9" stroke-width="2"/>
        <text x="590" y="1260" text-anchor="middle" class="contact-label">WHATSAPP</text>
        <text x="590" y="1295" text-anchor="middle" class="contact">${xmlEscape(whatsappLabel)}</text>
        ${websiteQr}
        <text x="540" y="1330" text-anchor="middle" class="tagline">No premium membership • No hidden charges</text>
      </svg>
    `);
}

async function generateInstagramTextImage(post) {
    const value = requireConfig();
    const fileName = stableFileName(
        post,
        value.whatsappNumber,
        value.websiteUrl
    );
    const filePath = path.join(value.outputDirectory, fileName);
    const publicUrl =
        `${value.publicBaseUrl}/${encodeURIComponent(fileName)}`;

    await fs.mkdir(value.outputDirectory, { recursive: true });

    try {
        await fs.access(filePath);
        return {
            generated: false,
            cached: true,
            fileName,
            filePath,
            publicUrl,
        };
    } catch {
        // Render when the deterministic cached image is absent.
    }

    await sharp(
        svgFor(post, {
            whatsappNumber: value.whatsappNumber,
            websiteUrl: value.websiteUrl,
        }),
        { density: 144 }
    )
        .resize(WIDTH, HEIGHT)
        .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
        .toFile(filePath);

    return {
        generated: true,
        cached: false,
        fileName,
        filePath,
        publicUrl,
    };
}

module.exports = {
    generateInstagramTextImage,
    imageLines,
    svgFor,
};
