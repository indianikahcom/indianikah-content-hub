const { z } = require("zod");

const randomDraftSchema = z.object({
    body: z.object({
        type: z
            .string()
            .trim()
            .transform((value) => value.toUpperCase())
            .refine(
                (value) => ["BOOK", "GUIDELINE", "BLOG"].includes(value),
                "Type must be BOOK, GUIDELINE, or BLOG"
            ),
        platform: z
            .string()
            .trim()
            .transform((value) => value.toUpperCase())
            .default("TELEGRAM"),
    }),
});

module.exports = {
    randomDraftSchema,
};
