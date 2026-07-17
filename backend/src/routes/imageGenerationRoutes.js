const express = require("express");
const imageGenerationController = require(
    "../controllers/imageGenerationController"
);

const router = express.Router();

router.post(
    "/posts/:id/generate-image",
    imageGenerationController.generateForPost
);

module.exports = router;
