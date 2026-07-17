const { z } = require("zod");

const idParams = z.object({ id: z.coerce.number().int().positive() });

const publishSchema = z.object({
  params: idParams,
  body: z.object({
    platforms: z.union([
      z.literal("ALL"),
      z.array(z.string().trim().min(1)).min(1)
    ]).default("ALL")
  }).default({})
});

const idSchema = z.object({ params: idParams });

module.exports = { publishSchema, idSchema };
