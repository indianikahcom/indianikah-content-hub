const express = require("express");
const sourceController = require("../controllers/sourceController");
const validate = require("../middleware/validate");
const {
    createSourceSchema,
    listSourcesSchema,
    sourceIdSchema,
    updateSourceStatusSchema,
    generatePostSchema
} = require("../validators/sourceValidator");

const router = express.Router();

router.post("/", validate(createSourceSchema), sourceController.createSource);
router.get("/", validate(listSourcesSchema), sourceController.getAllSources);
router.get("/:id", validate(sourceIdSchema), sourceController.getSourceById);
router.patch("/:id/status", validate(updateSourceStatusSchema), sourceController.updateSourceStatus);
router.post("/:id/generate-post", validate(generatePostSchema), sourceController.generateDraftPost);

module.exports = router;
