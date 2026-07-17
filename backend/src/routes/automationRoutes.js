const express = require("express");
const automationController = require("../controllers/automationController");
const validate = require("../middleware/validate");
const { randomDraftSchema } = require("../validators/automationValidator");

const router = express.Router();

router.post(
    "/random-draft",
    validate(randomDraftSchema),
    automationController.createRandomDraft
);

module.exports = router;
