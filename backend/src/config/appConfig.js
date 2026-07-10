require("dotenv").config();

module.exports = {
    appName: process.env.APP_NAME,
    version: process.env.APP_VERSION,
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV
};