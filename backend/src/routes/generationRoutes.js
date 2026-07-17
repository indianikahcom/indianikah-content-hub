const express = require("express");
const generationController = require("../controllers/generationController");

const router = express.Router();

router.post("/next/:type", generationController.generateNext);
router.post("/bundle", generationController.generateBundle);

module.exports = router;
