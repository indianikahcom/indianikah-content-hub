const { z } = require("zod");

const importProfilesSchema = z.object({
    body: z.object({
        hours: z.coerce.number().int().min(1).max(168).default(24),
        generateSummary: z.boolean().default(true)
    }).default({})
});
const importBlogsSchema = z.object({
    body: z.object({ hours: z.coerce.number().int().min(1).max(8760).default(168) }).default({})
});
const importAllSchema = z.object({
    body: z.object({
        profileHours: z.coerce.number().int().min(1).max(168).default(24),
        blogHours: z.coerce.number().int().min(1).max(8760).default(168),
        generateSummary: z.boolean().default(true)
    }).default({})
});
const listImportsSchema = z.object({
    query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) })
});
module.exports = { importProfilesSchema, importBlogsSchema, importAllSchema, listImportsSchema };
