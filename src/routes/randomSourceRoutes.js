const express = require("express");
const controller = require("../controllers/randomSourceController");

const router = express.Router();
router.get("/", controller.getRandomSource);

module.exports = router;
