const { z } = require("zod");

const sourceStatuses = [
    "NEW",
    "PROCESSING",
    "PROCESSED",
    "REJECTED",
    "ARCHIVED"
];

const positiveId = z.coerce.number().int().positive("ID must be a positive integer");

const createSourceSchema = z.object({
    body: z.object({
        type: z.string().trim().min(1, "Source type is required").max(50),
        title: z.string().trim().max(255).optional().nullable(),
        sourceUrl: z.string().trim().url("Source URL must be a valid URL").optional().nullable(),
        externalId: z.string().trim().max(255).optional().nullable(),
        rawContent: z.string().optional().nullable(),
        metadata: z.union([z.record(z.string(), z.unknown()), z.string()]).optional().nullable()
    })
});

const listSourcesSchema = z.object({
    query: z.object({
        type: z.string().trim().min(1).max(50).optional(),
        status: z.enum(sourceStatuses).optional(),
        search: z.string().trim().min(1).max(200).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20)
    })
});

const sourceIdSchema = z.object({
    params: z.object({ id: positiveId })
});

const updateSourceStatusSchema = z.object({
    params: z.object({ id: positiveId }),
    body: z.object({ status: z.enum(sourceStatuses) })
});

const generatePostSchema = z.object({
    params: z.object({ id: positiveId }),
    body: z.object({
        title: z.string().trim().min(1).max(200).optional(),
        content: z.string().trim().min(1).optional()
    }).default({})
});

module.exports = {
    sourceStatuses,
    createSourceSchema,
    listSourcesSchema,
    sourceIdSchema,
    updateSourceStatusSchema,
    generatePostSchema
};
