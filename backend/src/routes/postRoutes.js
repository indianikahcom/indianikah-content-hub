const express = require("express");
const postController = require("../controllers/postController");

const router = express.Router();

router.post("/posts", postController.createPost);
router.get("/posts", postController.getAllPosts);

module.exports = router;