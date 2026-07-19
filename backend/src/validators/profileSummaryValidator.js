const { z } = require("zod");
const previewProfileSummarySchema=z.object({query:z.object({hours:z.coerce.number().int().min(1).max(168).optional(),topLimit:z.coerce.number().int().min(1).max(10).optional(),fetchLimit:z.coerce.number().int().min(1).max(5000).optional()})});
const generateProfileSummarySchema=z.object({body:z.object({hours:z.coerce.number().int().min(1).max(168).default(24),topLimit:z.coerce.number().int().min(1).max(10).default(5),fetchLimit:z.coerce.number().int().min(1).max(5000).default(5000),dryRun:z.boolean().default(false),replaceExisting:z.boolean().default(false),composePlatforms:z.boolean().default(true)}).default({})});
module.exports={previewProfileSummarySchema,generateProfileSummarySchema};
