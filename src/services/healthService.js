const config = require("../config/appConfig");

function getHealthStatus() {
    return {
        status: "OK",
        version: config.version,
        application: config.appName,
        environment: config.environment
    };
}

module.exports = {
    getHealthStatus
};