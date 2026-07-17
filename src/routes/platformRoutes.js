const express = require("express");
const platformController = require("../controllers/platformController");
const router = express.Router();
router.get("/", platformController.list);
router.get("/facebook/test", platformController.testFacebook);
router.get("/linkedin/test", platformController.testLinkedin);
module.exports = router;
