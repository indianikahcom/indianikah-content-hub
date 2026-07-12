const { z } = require("zod");

const createPostSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    content: z.string().trim().min(1, "Content is required"),
    status: z.enum(["DRAFT"]).optional()
});

module.exports = {
    createPostSchema
};