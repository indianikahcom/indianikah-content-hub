const dashboardService = require("../services/dashboardService");

async function summary(req, res, next) {
    try {
        return res.json({
            success: true,
            data: await dashboardService.getSummary(),
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { summary };
