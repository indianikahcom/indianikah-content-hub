const express = require("express");
const controller = require("../controllers/campaignController");
const validate = require("../middleware/validate");
const { publishSchema, idSchema } = require("../validators/campaignValidator");

const router = express.Router();

router.post("/posts/:id/publish", validate(publishSchema), controller.publish);
router.get("/posts/:id/campaigns", validate(idSchema), controller.list);
router.post("/campaigns/:id/retry", validate(idSchema), controller.retry);

module.exports = router;
