const express = require("express");
const composerController = require("../controllers/composerController");
const validate = require("../middleware/validate");
const {
    updateVariantSchema,
    updateVariantStatusSchema
} = require("../validators/postVariantValidator");

const router = express.Router();

router.post("/:postId", composerController.compose);
router.get("/:postId", composerController.list);

router.put(
    "/variants/:variantId",
    validate(updateVariantSchema),
    composerController.update
);

router.patch(
    "/variants/:variantId/status",
    validate(updateVariantStatusSchema),
    composerController.updateStatus
);

module.exports = router;
