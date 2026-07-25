const fs = require("fs/promises");
const {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} = require("@aws-sdk/client-s3");
const {
    getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");
const AppError = require("../errors/AppError");

function r2Config() {
    const accountId = String(
        process.env.R2_ACCOUNT_ID ||
        process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
        ""
    ).trim();
    const endpoint = String(
        process.env.R2_ENDPOINT ||
        (accountId
            ? `https://${accountId}.r2.cloudflarestorage.com`
            : "")
    ).trim().replace(/\/$/, "");

    return {
        endpoint,
        accessKeyId: String(
            process.env.R2_ACCESS_KEY_ID ||
            process.env.AWS_ACCESS_KEY_ID ||
            ""
        ).trim(),
        secretAccessKey: String(
            process.env.R2_SECRET_ACCESS_KEY ||
            process.env.AWS_SECRET_ACCESS_KEY ||
            ""
        ).trim(),
        bucket: String(
            process.env.R2_BUCKET_NAME || "indianikah"
        ).trim(),
        prefix: String(
            process.env.R2_INSTAGRAM_PREFIX ||
            "instagram/posts"
        ).replace(/^\/+|\/+$/g, ""),
        signedUrlSeconds: Number(
            process.env.R2_SIGNED_URL_SECONDS || 3600
        ),
    };
}

function requireR2Config() {
    const config = r2Config();

    if (
        !config.endpoint ||
        !config.accessKeyId ||
        !config.secretAccessKey ||
        !config.bucket
    ) {
        throw new AppError(
            "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, " +
            "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.",
            503
        );
    }

    return config;
}

function client(config) {
    return new S3Client({
        region: "auto",
        endpoint: config.endpoint,
        forcePathStyle: true,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });
}

async function uploadInstagramImage(image) {
    const config = requireR2Config();
    const r2 = client(config);
    const key = `${config.prefix}/${image.fileName}`;
    const body = await fs.readFile(image.filePath);

    await r2.send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=86400",
    }));

    const publicUrl = await getSignedUrl(
        r2,
        new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
            ResponseContentType: "image/jpeg",
        }),
        {
            expiresIn: Math.max(
                900,
                Math.min(config.signedUrlSeconds, 604800)
            ),
        }
    );

    return {
        ...image,
        publicUrl,
        storage: "CLOUDFLARE_R2",
        bucket: config.bucket,
        objectKey: key,
    };
}

module.exports = {
    uploadInstagramImage,
};
