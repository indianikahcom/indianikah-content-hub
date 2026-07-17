const express = require("express");
const importController = require("../controllers/importController");
const validate = require("../middleware/validate");
const { importProfilesSchema, importBlogsSchema, importAllSchema, listImportsSchema } = require("../validators/importValidator");

const router = express.Router();
router.get("/connection", importController.testConnection);
router.get("/", validate(listImportsSchema), importController.listImports);
router.post("/profiles", validate(importProfilesSchema), importController.importProfiles);
router.post("/books", importController.importBooks);
router.post("/guidelines", importController.importGuidelines);
router.post("/blogs", validate(importBlogsSchema), importController.importBlogs);
router.post("/all", validate(importAllSchema), importController.importAll);
module.exports = router;
