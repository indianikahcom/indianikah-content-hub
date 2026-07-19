const { z } = require("zod");

const postIdParams = z.object({
    postId: z.coerce.number().int().positive(),
});

const publishPostSchema = z.object({
    params: postIdParams,
    body: z
        .object({
            platforms: z.array(z.string().min(1)).optional(),
            imageUrl: z.string().url().optional(),
            sendEmail: z.boolean().optional(),
            force: z.boolean().optional(),
        })
        .default({}),
});

const retryPostSchema = z.object({
    params: postIdParams,
    body: z
        .object({
            imageUrl: z.string().url().optional(),
            sendEmail: z.boolean().optional(),
        })
        .default({}),
});

const autoApproveSchema = z.object({
    params: postIdParams,
});

module.exports = {
    publishPostSchema,
    retryPostSchema,
    autoApproveSchema,
};
