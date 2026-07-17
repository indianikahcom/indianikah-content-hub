const express = require("express");
const controller = require("../controllers/aiGenerationController");
const router = express.Router();
router.get("/logs", controller.logs);
router.post("/sources/:id/generate", controller.generateSource);
router.post("/posts/:id/regenerate", controller.regeneratePost);
module.exports = router;
