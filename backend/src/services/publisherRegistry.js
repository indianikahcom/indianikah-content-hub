const telegram = require("./publishers/telegramPublisher");
const facebook = require("./publishers/facebookPublisher");
const linkedin = require("./publishers/linkedinPublisher");
const instagram = require("./publishers/instagramPublisher");
const unsupported = require("./publishers/unsupportedPublisher");

const registry = {
    TELEGRAM: telegram,
    FACEBOOK: facebook,
    LINKEDIN: linkedin,
    INSTAGRAM: instagram,
    WHATSAPP: unsupported,
    X: unsupported,
    YOUTUBE: unsupported,
};

function getPublisher(platform) {
    return registry[String(platform || "").toUpperCase()] || unsupported;
}

module.exports = {
    getPublisher,
};
