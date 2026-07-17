const promptRepository = require("../repositories/promptRepository");
const AppError = require("../errors/AppError");
const ALLOWED_KEYS = ["GLOBAL_SYSTEM", "PROFILE_SUMMARY", "BOOK", "GUIDELINE", "BLOG"];

async function listPrompts() { return promptRepository.list(); }
async function updatePrompt(key, content) {
    const normalized = String(key || "").toUpperCase();
    if (!ALLOWED_KEYS.includes(normalized)) throw new AppError("Unknown prompt key", 404);
    const text = String(content || "").trim();
    if (text.length < 20) throw new AppError("Prompt must contain at least 20 characters", 400);
    return promptRepository.update(normalized, text);
}
module.exports = { listPrompts, updatePrompt, ALLOWED_KEYS };
