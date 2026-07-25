const repository = require("../repositories/knowledgeLibraryRepository");
const AppError = require("../errors/AppError");

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return String(value).split(",").map((v) => v.trim()).filter(Boolean);
};

const tokenize = (value) => String(value || "")
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, " ")
  .split(/\s+/)
  .filter((token) => token.length > 2);

const jsonText = (value) => {
  if (!value) return "";
  try { return JSON.stringify(value); } catch { return String(value); }
};

function scoreItem(item, queryTokens, requestedTags, pinnedPriority) {
  const title = tokenize(item.title);
  const summary = tokenize(item.summary);
  const content = tokenize(item.content);
  const category = tokenize(`${item.category || ""} ${item.subcategory || ""}`);
  const tags = tokenize(jsonText(item.tags));
  let score = pinnedPriority ? Math.max(0, 25 - pinnedPriority / 10) : 0;

  for (const token of queryTokens) {
    if (title.includes(token)) score += 10;
    if (summary.includes(token)) score += 6;
    if (category.includes(token)) score += 5;
    if (tags.includes(token)) score += 5;
    if (content.includes(token)) score += 2;
  }
  for (const tag of requestedTags.map((v) => v.toLowerCase())) {
    if (tags.includes(tag) || category.includes(tag)) score += 6;
  }
  if (!queryTokens.length && !requestedTags.length) score += 1;
  return score;
}

function formatItem(item, index) {
  const reference = item.references ? `\nReferences: ${jsonText(item.references)}` : "";
  return `[Knowledge ${index + 1}]\nType: ${item.type}\nTitle: ${item.title}\nLanguage: ${item.language}\nCategory: ${item.category || "General"}\nContent:\n${item.content}${reference}`;
}

async function buildContext({ query, packKey, types, languages, tags, maxItems, maxCharacters, generationType, logUsage = true }) {
  const pack = packKey ? await repository.findPack(packKey) : null;
  if (packKey && (!pack || !pack.isActive)) throw new AppError("Knowledge pack not found or inactive", 404);

  const effectiveTypes = normalizeArray(types).length ? normalizeArray(types) : normalizeArray(pack?.contentTypes);
  const effectiveLanguages = normalizeArray(languages).length ? normalizeArray(languages) : normalizeArray(pack?.languages);
  const effectiveTags = [...new Set([...normalizeArray(pack?.tags), ...normalizeArray(tags)])];
  const candidates = await repository.listApprovedCandidates({
    types: effectiveTypes,
    languages: effectiveLanguages,
    packId: pack?.id,
  });

  const priorities = new Map((pack?.items || []).map((entry) => [entry.knowledgeItemId, entry.priority]));
  const queryTokens = tokenize(query);
  const ranked = candidates
    .map((item) => ({ item, score: scoreItem(item, queryTokens, effectiveTags, priorities.get(item.id)) }))
    .filter((entry) => entry.score > 0 || priorities.has(entry.item.id))
    .sort((a, b) => b.score - a.score || Number(priorities.has(b.item.id)) - Number(priorities.has(a.item.id)) || b.item.updatedAt - a.item.updatedAt);

  const itemLimit = Math.min(Number(maxItems) || pack?.maxItems || 8, 20);
  const charLimit = Math.min(Number(maxCharacters) || pack?.maxCharacters || 12000, 40000);
  const selected = [];
  let used = 0;
  for (const entry of ranked) {
    if (selected.length >= itemLimit) break;
    const formatted = formatItem(entry.item, selected.length);
    if (selected.length && used + formatted.length > charLimit) continue;
    selected.push({ ...entry, formatted });
    used += formatted.length;
  }

  const header = [
    "INDIANIKAH CURATED KNOWLEDGE CONTEXT",
    "Use only relevant facts from this context. Do not invent Quran/Hadith references or statistics.",
    pack?.instructions ? `Pack instructions: ${pack.instructions}` : null,
  ].filter(Boolean).join("\n");
  const context = `${header}\n\n${selected.map((entry) => entry.formatted).join("\n\n")}`.trim();

  if (logUsage && selected.length) {
    await repository.logContext(selected.map((entry) => ({
      query: String(query || ""),
      packId: pack?.id || null,
      knowledgeItemId: entry.item.id,
      score: entry.score,
      generationType: generationType || null,
    })));
  }

  return {
    query,
    pack: pack ? { id: pack.id, key: pack.key, name: pack.name } : null,
    items: selected.map(({ item, score }) => ({ ...item, relevanceScore: score })),
    context,
    characters: context.length,
    availableCandidates: candidates.length,
  };
}

module.exports = { buildContext };
