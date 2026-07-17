const { z } = require("zod");

const idSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
});

const addRandomSchema = z.object({
    body: z.object({
        type: z
            .string()
            .trim()
            .transform((value) => value.toUpperCase())
            .refine(
                (value) =>
                    ["BOOK", "GUIDELINE", "BLOG"].includes(value),
                "Type must be BOOK, GUIDELINE, or BLOG"
            ),
        platform: z
            .string()
            .trim()
            .transform((value) => value.toUpperCase())
            .default("ALL"),
        scheduledAt: z.coerce.date().optional().nullable(),
        priority: z.coerce.number().int().min(1).max(1000).default(100),
    }),
});

const listSchema = z.object({
    query: z.object({
        status: z.string().trim().optional(),
        contentType: z.string().trim().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
    }),
});

module.exports = {
    idSchema,
    addRandomSchema,
    listSchema,
};
