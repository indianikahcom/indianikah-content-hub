const { z } = require("zod");

const createPostSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    content: z.string().trim().min(1, "Content is required"),
    status: z.literal("DRAFT").optional()
});

const updatePostStatusSchema = z.object({
    status: z.enum([
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED"
    ])
});

module.exports = {
    createPostSchema,
    updatePostStatusSchema
};