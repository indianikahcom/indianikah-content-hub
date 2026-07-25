const { z } = require("zod");
const knowledgeTypes = ["PROFILE","BOOK","VIDEO","BLOG","NEWS","QURAN","HADITH","DUA","ISLAMIC_ARTICLE","MARRIAGE_GUIDE","MARRIAGE_TIP","FAMILY_LIFE","STATISTICS","AI_INSIGHT","MANUAL","EXTERNAL_API"];
const generatePost = z.object({
  body: z.object({
    type: z.string().trim().transform((value) => value.toUpperCase()).refine(
      (value) => ["QURAN", "HADITH", "DUA"].includes(value),
      "Type must be QURAN, HADITH, or DUA"
    )
  })
});
const jsonArray = z.array(z.string().trim().min(1)).optional();
const item = z.object({
  type: z.enum(knowledgeTypes), title: z.string().trim().min(3).max(300), content: z.string().trim().min(10),
  summary: z.string().trim().max(1000).nullable().optional(), language: z.string().trim().min(2).max(20).default("en"),
  category: z.string().trim().max(100).nullable().optional(), subcategory: z.string().trim().max(100).nullable().optional(),
  metadata: z.any().optional(), references: z.any().optional(), tags: z.any().optional(), status: z.enum(["DRAFT","PENDING_APPROVAL","APPROVED","REJECTED","ARCHIVED"]).optional(), sourceId: z.number().int().positive().nullable().optional(),
});
const packBody = z.object({
  key: z.string().trim().regex(/^[A-Z0-9_]+$/).min(3).max(80), name: z.string().trim().min(3).max(150),
  description: z.string().trim().max(1000).nullable().optional(), instructions: z.string().trim().max(4000).nullable().optional(),
  contentTypes: jsonArray, languages: jsonArray, tags: jsonArray,
  maxItems: z.coerce.number().int().min(1).max(20).default(8), maxCharacters: z.coerce.number().int().min(1000).max(40000).default(12000), isActive: z.boolean().default(true),
});
const queryBody = z.object({ query: z.string().trim().min(2).max(1000), packKey: z.string().trim().max(80).optional(), types: jsonArray, languages: jsonArray, tags: jsonArray, maxItems: z.coerce.number().int().min(1).max(20).optional(), maxCharacters: z.coerce.number().int().min(1000).max(40000).optional(), generationType: z.string().trim().max(80).optional(), logUsage: z.boolean().optional() });
module.exports = {
  generatePost,
  bulk: z.object({ body: z.object({ items: z.array(item).min(1).max(200), approve: z.boolean().default(false) }) }),
  query: z.object({ body: queryBody }),
  createPack: z.object({ body: packBody }),
  updatePack: z.object({ params: z.object({ id: z.coerce.number().int().positive() }), body: packBody.partial().refine((v) => Object.keys(v).length > 0) }),
  id: z.object({ params: z.object({ id: z.string().trim().min(1).max(80) }) }),
  packItem: z.object({ params: z.object({ id: z.coerce.number().int().positive() }), body: z.object({ knowledgeItemId: z.coerce.number().int().positive(), priority: z.coerce.number().int().min(1).max(1000).default(100), notes: z.string().trim().max(500).nullable().optional() }) }),
  removePackItem: z.object({ params: z.object({ id: z.coerce.number().int().positive(), knowledgeItemId: z.coerce.number().int().positive() }) }),
};
