const AppError = require("../errors/AppError");

const BRAND_LINE = "IndiaNikah â€” 100% free forever.";

function parseMetadata(value) {
    if (!value) return {};
    if (typeof value === "object") return value;
    try { return JSON.parse(value); } catch { return {}; }
}

function clean(value) {
    if (value === undefined || value === null) return "";
    return String(value).trim();
}

function compact(lines) {
    return lines.filter((line) => line !== null && line !== undefined).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function profileDraft(source) {
    const m = parseMetadata(source.metadata);
    const location = clean(m.currentCity || m.city);
    const state = clean(m.currentState || m.state);
    const locationText = [location, state].filter(Boolean).join(", ");
    const profileUrl = clean(source.sourceUrl);

    const facts = [
        m.age ? `${m.age} years` : null,
        clean(m.gender) || null,
        clean(m.maritalStatus) || null,
        clean(m.education) || null,
        clean(m.occupation) || null,
        locationText || null
    ].filter(Boolean);

    return {
        title: `Matrimonial profile${location ? ` from ${location}` : " on IndiaNikah"}`,
        content: compact([
            "ðŸ’ Matrimonial Profile",
            "",
            facts.length ? facts.map((fact) => `â€¢ ${fact}`).join("\n") : clean(source.rawContent),
            "",
            profileUrl ? `View profile: ${profileUrl}` : null,
            "",
            "Please verify profile details directly on IndiaNikah before proceeding.",
            BRAND_LINE
        ])
    };
}

function bookDraft(source) {
    const m = parseMetadata(source.metadata);
    return {
        title: `Book recommendation: ${clean(source.title) || "Useful reading"}`,
        content: compact([
            "ðŸ“š Recommended Reading",
            clean(source.title) || "Useful resource",
            clean(m.author) ? `Author: ${clean(m.author)}` : null,
            clean(m.language) ? `Language: ${clean(m.language)}` : null,
            "",
            clean(source.rawContent) || "Read, reflect, and share beneficial knowledge.",
            "",
            clean(source.sourceUrl) ? `Read here: ${clean(source.sourceUrl)}` : null,
            BRAND_LINE
        ])
    };
}

function genericDraft(source) {
    return {
        title: clean(source.title) || `${clean(source.type) || "Content"} update`,
        content: compact([
            clean(source.title),
            "",
            clean(source.rawContent) || "New useful content is available on IndiaNikah.",
            "",
            clean(source.sourceUrl) ? `Read more: ${clean(source.sourceUrl)}` : null,
            BRAND_LINE
        ])
    };
}

function createTemplateDraft(source) {
    const type = clean(source?.type).toUpperCase();
    if (!source) throw new AppError("Content source is required", 400);
    if (type === "PROFILE") return profileDraft(source);
    if (type === "BOOK") return bookDraft(source);
    return genericDraft(source);
}

module.exports = { createTemplateDraft };

