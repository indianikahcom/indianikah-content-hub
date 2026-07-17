const { z } = require("zod");

const updateVariantSchema = z.object({
    body: z.object({
        title: z.string().trim().max(255).nullable().optional(),
        content: z.string().trim().min(1, "Variant content is required").max(10000)
    })
});

const updateVariantStatusSchema = z.object({
    body: z.object({
        status: z.enum(["DRAFT", "READY"])
    })
});

module.exports = {
    updateVariantSchema,
    updateVariantStatusSchema
};
