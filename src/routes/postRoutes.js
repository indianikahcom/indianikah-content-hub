const express = require("express");

const postController = require(
    "../controllers/postController"
);
const publicationController = require("../controllers/publicationController");

const router = express.Router();

router.post(
    "/posts",
    postController.createPost
);

router.get(
    "/posts",
    postController.getAllPosts
);

router.get(
    "/posts/:id",
    postController.getPostById
);

router.put(
    "/posts/:id",
    postController.updatePost
);

router.patch(
    "/posts/:id/status",
    postController.updatePostStatus
);

router.post(
    "/posts/:id/publish/telegram",
    publicationController.publishToTelegram
);

router.get(
    "/posts/:id/publications",
    publicationController.getPostPublications
);

module.exports = router;