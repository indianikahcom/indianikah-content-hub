const { z } = require("zod");

const generationOptions = z.object({
    provider: z.enum(["AUTO", "OPENAI", "TEMPLATE"]).default("AUTO"),
    replaceExisting: z.boolean().default(false),
    composePlatforms: z.boolean().default(true)
});

const generateSourceSchema = z.object({
    params: z.object({ sourceId: z.coerce.number().int().positive() }),
    body: generationOptions.default({})
});

const generateBatchSchema = z.object({
    body: generationOptions.extend({
        type: z.string().trim().min(1).max(50).optional(),
        limit: z.coerce.number().int().min(1).max(50).default(10)
    }).default({})
});

const previewSchema = z.object({
    params: z.object({ postId: z.coerce.number().int().positive() })
});

module.exports = { generateSourceSchema, generateBatchSchema, previewSchema };
