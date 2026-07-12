const express = require("express");
const postController = require("../controllers/postController");

const router = express.Router();

router.post("/posts", postController.createPost);
router.get("/posts", postController.getAllPosts);
router.patch("/posts/:id/status", postController.updatePostStatus);

module.exports = router;