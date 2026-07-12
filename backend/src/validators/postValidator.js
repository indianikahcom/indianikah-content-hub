const { z } = require("zod");

const postStatuses = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED"
];

const createPostSchema = z.object({
    title: z.string()
        .trim()
        .min(1, "Title is required")
        .max(200, "Title cannot exceed 200 characters"),

    content: z.string()
        .trim()
        .min(1, "Content is required"),

    status: z.literal("DRAFT").optional()
});

const updatePostSchema = z.object({
    title: z.string()
        .trim()
        .min(1, "Title is required")
        .max(200, "Title cannot exceed 200 characters"),

    content: z.string()
        .trim()
        .min(1, "Content is required")
});

const updatePostStatusSchema = z.object({
    status: z.enum(postStatuses)
});

const postStatusFilterSchema = z.enum(postStatuses);

module.exports = {
    createPostSchema,
    updatePostSchema,
    updatePostStatusSchema,
    postStatusFilterSchema
};