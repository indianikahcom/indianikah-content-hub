const express = require("express");
const controller = require("../controllers/queueController");
const validate = require("../middleware/validate");
const {
    idSchema,
    addRandomSchema,
    listSchema,
} = require("../validators/queueValidator");

const router = express.Router();

router.get("/", validate(listSchema), controller.list);
router.post("/random", validate(addRandomSchema), controller.addRandom);
router.get("/:id", validate(idSchema), controller.get);
router.post("/:id/approve", validate(idSchema), controller.approve);
router.post("/:id/publish", validate(idSchema), controller.publish);
router.post("/:id/cancel", validate(idSchema), controller.cancel);

module.exports = router;
