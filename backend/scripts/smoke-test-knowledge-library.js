const prisma = require("../src/database/prisma");
const contextService = require("../src/services/knowledgeContextService");

async function main() {
  const pack = await prisma.knowledgePack.findUnique({ where: { key: "MARRIAGE_GUIDANCE" } });
  if (!pack) throw new Error("Default knowledge packs are not seeded");
  const result = await contextService.buildContext({ query: "choosing a spouse character", packKey: "MARRIAGE_GUIDANCE", logUsage: false });
  if (!result.context.includes("INDIANIKAH CURATED KNOWLEDGE CONTEXT")) throw new Error("Context header missing");
  console.log("Knowledge Library smoke test passed.", { pack: pack.key, selectedItems: result.items.length });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
