const productionContentRepository = require("../repositories/productionContentRepository");
const sourceRepository = require("../repositories/sourceRepository");
const importRepository = require("../repositories/importRepository");
const sourceService = require("./sourceService");

const SITE_URL = "https://indianikah.com";

function clean(value) {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text || null;
}

function absoluteMediaUrl(path) {
    const value = clean(path);
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    return `${SITE_URL}/${value.replace(/^\/+/, "")}`;
}

function stripHtml(value) {
    return clean(value)?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
}

function sanitizePreview(value) {
    if (!value) return null;
    let preview = value;
    if (typeof preview === "string") {
        try { preview = JSON.parse(preview); } catch { preview = { description: preview }; }
    }

    const description = stripHtml(preview?.description)
        ?.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]")
        .replace(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/g, "[phone removed]")
        .slice(0, 1200) || null;

    return {
        title: clean(preview?.title),
        image: clean(preview?.image),
        description
    };
}

async function runImport({ importType, fetchRows, mapRow }) {
    const run = await importRepository.createRun({
        importType,
        status: "RUNNING"
    });

    try {
        const rows = await fetchRows();
        let importedCount = 0;
        let skippedCount = 0;

        for (const row of rows) {
            const sourceData = mapRow(row);
            const existing = await sourceRepository.findByExternalId(sourceData.externalId);
            if (existing) {
                skippedCount += 1;
                continue;
            }
            await sourceService.createSource(sourceData);
            importedCount += 1;
        }

        const completed = await importRepository.completeRun(run.id, {
            status: "COMPLETED",
            fetchedCount: rows.length,
            importedCount,
            skippedCount
        });
        return { run: completed };
    } catch (error) {
        await importRepository.completeRun(run.id, {
            status: "FAILED",
            errorMessage: error.message
        });
        throw error;
    }
}

function importBooks() {
    return runImport({
        importType: "PRODUCTION_BOOKS",
        fetchRows: productionContentRepository.findAllBooks,
        mapRow: (book) => ({
            type: "BOOK",
            title: clean(book.title),
            externalId: `book:${book.id}`,
            rawContent: [
                `Book: ${clean(book.title)}`,
                `Author: ${clean(book.author)}`,
                `Language: ${clean(book.language)}`,
                `Downloads: ${book.download_count}`
            ].filter(Boolean).join("\n"),
            metadata: {
                productionId: book.id,
                author: clean(book.author),
                language: clean(book.language),
                pdfUrl: absoluteMediaUrl(book.pdf),
                coverUrl: absoluteMediaUrl(book.cover),
                downloadCount: book.download_count,
                source: "django.book_book"
            }
        })
    });
}

function importGuidelines() {
    return runImport({
        importType: "PRODUCTION_GUIDELINES",
        fetchRows: productionContentRepository.findAllGuidelines,
        mapRow: (item) => ({
            type: "GUIDELINE",
            title: clean(item.title),
            sourceUrl: clean(item.youtube_code)
                ? `https://www.youtube.com/watch?v=${encodeURIComponent(item.youtube_code)}`
                : null,
            externalId: `guideline:${item.id}`,
            rawContent: [
                clean(item.title),
                clean(item.title_hindi),
                clean(item.youtube_code) ? `Video: https://www.youtube.com/watch?v=${item.youtube_code}` : null
            ].filter(Boolean).join("\n\n"),
            metadata: {
                productionId: String(item.id),
                order: item.order,
                titleHindi: clean(item.title_hindi),
                youtubeCode: clean(item.youtube_code),
                source: "django.configs_guideline"
            }
        })
    });
}

function importBlogs() {
    return runImport({
        importType: "PRODUCTION_BLOGS",
        fetchRows: productionContentRepository.findAllBlogs,
        mapRow: (blog) => {
            const preview = sanitizePreview(blog.preview);
            return {
                type: "BLOG",
                title: clean(blog.title),
                sourceUrl: clean(blog.link),
                externalId: `blog:${blog.id}`,
                rawContent: [
                    clean(blog.title),
                    preview?.title,
                    preview?.description
                ].filter(Boolean).join("\n\n"),
                metadata: {
                    productionId: String(blog.id),
                    createdOn: blog.created_on,
                    previewImage: preview?.image || null,
                    previewTitle: preview?.title || null,
                    source: "django.configs_blog",
                    sanitized: true
                }
            };
        }
    });
}

async function importAll({ profileImportService, profileHours = 24, blogHours = 168, generateSummary = true }) {
    const profiles = await profileImportService.importRecentProfiles({ hours: profileHours, generateSummary });
    const books = await importBooks();
    const guidelines = await importGuidelines();
    const blogs = await importBlogs();
    return { profiles, books, guidelines, blogs };
}

module.exports = { importBooks, importGuidelines, importBlogs, importAll, sanitizePreview };
