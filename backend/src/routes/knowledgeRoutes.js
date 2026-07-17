const express = require("express");
const controller = require("../controllers/knowledgeController");
const validate = require("../middleware/validate");
const schemas = require("../validators/knowledgeValidator");

const router = express.Router();

router.post("/", validate(schemas.createKnowledgeSchema), controller.create);
router.get("/", validate(schemas.listKnowledgeSchema), controller.list);
router.get("/:id", validate(schemas.idParamSchema), controller.get);
router.put("/:id", validate(schemas.updateKnowledgeSchema), controller.update);
router.patch(
  "/:id/status",
  validate(schemas.statusSchema),
  controller.changeStatus
);
router.delete("/:id", validate(schemas.idParamSchema), controller.remove);

module.exports = router;
