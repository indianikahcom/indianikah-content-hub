const express = require("express");
const validate = require("../middleware/validate");
const controller = require("../controllers/publishingController");
const {
    publishPostSchema,
    retryPostSchema,
    autoApproveSchema,
} = require("../validators/publishingValidator");

const router = express.Router();

router.get("/automation/status", controller.status);

router.post(
    "/posts/:postId/publish",
    validate(publishPostSchema),
    controller.publishPost
);

router.post(
    "/posts/:postId/retry-failed",
    validate(retryPostSchema),
    controller.retryFailed
);

router.post("/queue/process", controller.processQueue);

router.post(
    "/posts/:postId/auto-approve-publish",
    validate(autoApproveSchema),
    controller.autoApproveAndPublish
);

module.exports = router;
