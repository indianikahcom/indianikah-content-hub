const postService = require("../services/postService");
const {
    generatePostImage,
} = require("../services/aiImageGenerationService");

async function generateForPost(req, res, next) {
    try {
        const post = await postService.getPostById(Number(req.params.id));
        const result = await generatePostImage(post, {
            force: req.body?.force === true,
        });

        res.status(result.generated ? 201 : 200).json({
            success: true,
            message: result.generated
                ? "AI image generated"
                : "Existing generated image reused",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    generateForPost,
};
