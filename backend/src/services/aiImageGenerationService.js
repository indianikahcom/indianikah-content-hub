const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const AppError = require("../errors/AppError");

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const REQUEST_TIMEOUT_MS = 120000;

function imageGenerationConfig() {
    const publicBaseUrl = String(
        process.env.AI_IMAGE_PUBLIC_BASE_URL || ""
    ).trim().replace(/\/$/, "");

    return {
        enabled:
            String(process.env.AI_IMAGE_GENERATION_ENABLED).toLowerCase() ===
            "true",
        apiKey: String(process.env.OPENAI_API_KEY || "").trim(),
        model: String(process.env.OPENAI_IMAGE_MODEL || "gpt-image-1").trim(),
        size: String(process.env.OPENAI_IMAGE_SIZE || "1024x1024").trim(),
        quality: String(process.env.OPENAI_IMAGE_QUALITY || "medium").trim(),
        outputFormat: String(
            process.env.OPENAI_IMAGE_OUTPUT_FORMAT || "png"
        ).trim().toLowerCase(),
        publicBaseUrl,
        outputDirectory: path.resolve(
            process.cwd(),
            process.env.AI_IMAGE_OUTPUT_DIR || "public/generated-media"
        ),
        brandName: String(
            process.env.AI_IMAGE_BRAND_NAME || "IndiaNikah"
        ).trim(),
    };
}

function requireImageGenerationConfig() {
    const config = imageGenerationConfig();

    if (!config.enabled) {
        throw new AppError("AI image generation is disabled", 409);
    }

    if (!config.apiKey) {
        throw new AppError("OPENAI_API_KEY is not configured", 503);
    }

    if (!/^https:\/\//i.test(config.publicBaseUrl)) {
        throw new AppError(
            "AI_IMAGE_PUBLIC_BASE_URL must be a public HTTPS URL",
            503
        );
    }

    return config;
}

function parseJson(value) {
    if (!value) return {};
    if (typeof value === "object") return value;

    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

function postText(post) {
    const instagramVariant = (post?.variants || []).find(
        (item) => String(item.platform).toUpperCase() === "INSTAGRAM"
    );

    return String(
        instagramVariant?.content || post?.content || post?.title || ""
    ).trim();
}

function sourceType(post) {
    return String(
        post?.source?.type || post?.contentType || "GENERAL"
    ).toUpperCase();
}

function buildImagePrompt(post, config) {
    const metadata = parseJson(post?.source?.metadata);
    const title = String(post?.title || metadata.title || "").trim();
    const content = postText(post).slice(0, 1800);
    const type = sourceType(post);

    const typeDirection = {
        BOOK: "Create an elegant editorial illustration inspired by books and learning. Do not reproduce a copyrighted book cover.",
        NEWS: "Create a neutral editorial illustration representing the topic. Do not imitate a news publisher or use a real person's likeness.",
        PROFILE: "Create a privacy-safe matrimonial themed illustration with no identifiable real people and no personal data.",
        VIDEO: "Create a cinematic social media thumbnail-style illustration without copying an existing video thumbnail.",
        STATISTICS: "Create a clean modern infographic-style background with abstract data visualization elements.",
    }[type] || "Create a tasteful modern social-media illustration relevant to the topic.";

    return [
        `Create a square 1:1 social media image for ${config.brandName}.`,
        typeDirection,
        "Use a clean premium Indian-Muslim matrimonial brand aesthetic, respectful and family-friendly.",
        "Avoid faces in close-up, avoid identifiable people, avoid logos of other organizations, avoid watermarks, and avoid dense text.",
        "Leave comfortable negative space for optional caption overlays. Do not put long paragraphs in the image.",
        title ? `Topic title: ${title}` : "",
        content ? `Post context: ${content}` : "",
    ].filter(Boolean).join("\n");
}

function safeExtension(format) {
    return ["png", "jpeg", "jpg", "webp"].includes(format)
        ? (format === "jpg" ? "jpeg" : format)
        : "png";
}

function stableFileName(post, extension) {
    const id = post?.id ? String(post.id) : "draft";
    const digest = crypto
        .createHash("sha256")
        .update(`${id}|${post?.updatedAt || ""}|${postText(post)}`)
        .digest("hex")
        .slice(0, 12);

    return `post-${id}-${digest}.${extension}`;
}

async function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error.name === "AbortError") {
            throw new AppError("AI image generation timed out", 504);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function callOpenAI(config, prompt) {
    const response = await fetchWithTimeout(OPENAI_IMAGES_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: config.model,
            prompt,
            size: config.size,
            quality: config.quality,
            output_format: config.outputFormat,
            n: 1,
        }),
    });

    const text = await response.text();
    let payload = {};

    try {
        payload = text ? JSON.parse(text) : {};
    } catch {
        payload = { raw: text.slice(0, 1000) };
    }

    if (!response.ok || payload.error) {
        throw new AppError(
            payload?.error?.message || "OpenAI image generation failed",
            response.status >= 400 ? response.status : 502,
            { provider: "OPENAI", response: payload }
        );
    }

    const item = payload?.data?.[0];
    if (!item?.b64_json && !item?.url) {
        throw new AppError("OpenAI returned no generated image", 502);
    }

    if (item.b64_json) {
        return Buffer.from(item.b64_json, "base64");
    }

    const imageResponse = await fetchWithTimeout(item.url, { method: "GET" });
    if (!imageResponse.ok) {
        throw new AppError("Could not download generated image", 502);
    }

    return Buffer.from(await imageResponse.arrayBuffer());
}

async function generatePostImage(post, options = {}) {
    const config = requireImageGenerationConfig();
    const extension = safeExtension(config.outputFormat);
    const fileName = stableFileName(post, extension);
    const filePath = path.join(config.outputDirectory, fileName);
    const publicUrl = `${config.publicBaseUrl}/${encodeURIComponent(fileName)}`;

    await fs.mkdir(config.outputDirectory, { recursive: true });

    if (!options.force) {
        try {
            await fs.access(filePath);
            return {
                generated: false,
                cached: true,
                provider: "OPENAI",
                model: config.model,
                fileName,
                filePath,
                publicUrl,
            };
        } catch {
            // Generate a new image when the cached file does not exist.
        }
    }

    const prompt = buildImagePrompt(post, config);
    const imageBuffer = await callOpenAI(config, prompt);
    await fs.writeFile(filePath, imageBuffer);

    return {
        generated: true,
        cached: false,
        provider: "OPENAI",
        model: config.model,
        fileName,
        filePath,
        publicUrl,
        prompt,
        sizeBytes: imageBuffer.length,
    };
}

module.exports = {
    imageGenerationConfig,
    buildImagePrompt,
    generatePostImage,
};
