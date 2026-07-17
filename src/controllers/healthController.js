const healthService = require("../services/healthService");

function healthCheck(req, res) {
    const healthStatus = healthService.getHealthStatus();
    res.json(healthStatus);
}

module.exports = {
    healthCheck
};