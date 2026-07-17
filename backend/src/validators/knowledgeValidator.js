const { z } = require("zod");

const types = [
  "PROFILE", "BOOK", "VIDEO", "BLOG", "NEWS", "QURAN", "HADITH", "DUA",
  "ISLAMIC_ARTICLE", "MARRIAGE_GUIDE", "MARRIAGE_TIP", "FAMILY_LIFE",
  "STATISTICS", "AI_INSIGHT", "MANUAL", "EXTERNAL_API",
];

const statuses = [
  "DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "ARCHIVED",
];

const optionalText = (max) => z.string().trim().max(max).nullable().optional();

const createKnowledgeSchema = z.object({
  body: z.object({
    type: z.enum(types),
    title: z.string().trim().min(3).max(300),
    content: z.string().trim().min(10),
    summary: optionalText(1000),
    language: z.string().trim().min(2).max(20).default("en"),
    category: optionalText(100),
    subcategory: optionalText(100),
    metadata: z.any().optional(),
    references: z.any().optional(),
    tags: z.any().optional(),
    status: z.enum(statuses).default("DRAFT"),
    sourceId: z.coerce.number().int().positive().nullable().optional(),
  }),
});

const updateKnowledgeSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    type: z.enum(types).optional(),
    title: z.string().trim().min(3).max(300).optional(),
    content: z.string().trim().min(10).optional(),
    summary: optionalText(1000),
    language: z.string().trim().min(2).max(20).optional(),
    category: optionalText(100),
    subcategory: optionalText(100),
    metadata: z.any().optional(),
    references: z.any().optional(),
    tags: z.any().optional(),
    sourceId: z.coerce.number().int().positive().nullable().optional(),
  }).refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  }),
});

const idParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const statusSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({ status: z.enum(statuses) }),
});

const listKnowledgeSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    type: z.enum(types).optional(),
    status: z.enum(statuses).optional(),
    language: z.string().trim().max(20).optional(),
    category: z.string().trim().max(100).optional(),
    subcategory: z.string().trim().max(100).optional(),
    sourceId: z.coerce.number().int().positive().optional(),
    search: z.string().trim().max(200).optional(),
  }),
});

module.exports = {
  createKnowledgeSchema,
  updateKnowledgeSchema,
  idParamSchema,
  statusSchema,
  listKnowledgeSchema,
};
