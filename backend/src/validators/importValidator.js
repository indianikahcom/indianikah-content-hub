const { z } = require("zod");

const booleanValue = z.preprocess((value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
}, z.boolean());

const importProfilesSchema = z.object({
    body: z.object({
        mode: z.enum(["CURSOR", "RECENT"]).default("CURSOR"),
        batchSize: z.coerce.number().int().min(10).max(1000).default(250),
        maxBatches: z.coerce.number().int().min(1).max(200).default(20),
        startAfterId: z.coerce.number().int().min(0).optional(),
        hours: z.coerce.number().int().min(1).max(8760).default(24),
        limit: z.coerce.number().int().min(1).max(5000).default(1000),
        generateSummary: booleanValue.default(false),
        dryRun: booleanValue.default(false),
    }).default({}),
});

const importBlogsSchema = z.object({ body: z.object({ hours: z.coerce.number().int().min(1).max(8760).default(168) }).default({}) });
const importAllSchema = z.object({
    body: z.object({
        profileHours: z.coerce.number().int().min(1).max(168).default(24),
        blogHours: z.coerce.number().int().min(1).max(8760).default(168),
        generateSummary: booleanValue.default(true),
    }).default({}),
});
const listImportsSchema = z.object({ query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }) });

module.exports = { importProfilesSchema, importBlogsSchema, importAllSchema, listImportsSchema };
