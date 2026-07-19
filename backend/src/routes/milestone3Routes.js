const express = require("express");
const validate = require("../middleware/validate");
const controller = require("../controllers/milestone3Controller");
const { generateSourceSchema, generateBatchSchema, previewSchema } = require("../validators/milestone3Validator");

const router = express.Router();
router.post("/sources/:sourceId/generate", validate(generateSourceSchema), controller.generateSource);
router.post("/batch/generate", validate(generateBatchSchema), controller.generateBatch);
router.get("/posts/:postId/preview", validate(previewSchema), controller.preview);
module.exports = router;
