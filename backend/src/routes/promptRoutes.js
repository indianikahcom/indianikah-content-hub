const express = require("express");
const promptController = require("../controllers/promptController");
const router = express.Router();
router.get("/", promptController.list);
router.put("/:key", promptController.update);
module.exports = router;
