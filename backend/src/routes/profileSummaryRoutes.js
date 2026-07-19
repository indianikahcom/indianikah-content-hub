const express=require("express");
const validate=require("../middleware/validate");
const controller=require("../controllers/profileSummaryController");
const {previewProfileSummarySchema,generateProfileSummarySchema}=require("../validators/profileSummaryValidator");
const router=express.Router();
router.get("/daily/preview",validate(previewProfileSummarySchema),controller.preview);
router.post("/daily/generate",validate(generateProfileSummarySchema),controller.generate);
module.exports=router;
