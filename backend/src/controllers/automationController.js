const randomDraftService = require("../services/randomDraftService");

async function createRandomDraft(req, res, next) {
    try {
        const data = await randomDraftService.createRandomDraft({
            type: req.body.type,
            platform: req.body.platform || "TELEGRAM",
        });

        return res.status(data.generated ? 201 : 200).json({
            success: true,
            message: data.generated
                ? "Random source selected and AI draft generated"
                : "Random unpublished source selected with an existing post",
            data,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createRandomDraft,
};
