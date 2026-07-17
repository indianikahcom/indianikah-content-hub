const prisma = require("../database/prisma");
const { DEFAULT_PROMPTS } = require("../ai/prompts/defaults");

async function ensureDefaults() {
    for (const [key, value] of Object.entries(DEFAULT_PROMPTS)) {
        await prisma.promptSetting.upsert({
            where: { key },
            update: {},
            create: { key, name: value.name, content: value.content, isSystem: value.isSystem }
        });
    }
}
async function list() { await ensureDefaults(); return prisma.promptSetting.findMany({ orderBy: [{ isSystem: "desc" }, { key: "asc" }] }); }
async function findByKey(key) { await ensureDefaults(); return prisma.promptSetting.findUnique({ where: { key } }); }
async function update(key, content) { await ensureDefaults(); return prisma.promptSetting.update({ where: { key }, data: { content } }); }
module.exports = { ensureDefaults, list, findByKey, update };
