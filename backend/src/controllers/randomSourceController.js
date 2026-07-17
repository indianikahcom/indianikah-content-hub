const service = require("../services/randomSourceService");

async function getRandomSource(req, res, next) {
    try {
        const source = await service.getRandomUnpublishedSource({
            type: req.query.type,
            platform: req.query.platform || "TELEGRAM"
        });

        res.status(200).json({
            success: true,
            message: "Random unpublished source selected",
            data: source
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getRandomSource };
