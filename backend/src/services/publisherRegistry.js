const telegram = require("./publishers/telegramPublisher");
const facebook = require("./publishers/facebookPublisher");
const linkedin = require("./publishers/linkedinPublisher");
const instagram = require("./publishers/instagramPublisher");
const x = require("./publishers/xPublisher");
const AppError = require("../errors/AppError");

const registry = {
    TELEGRAM: telegram,
    FACEBOOK: facebook,
    LINKEDIN: linkedin,
    INSTAGRAM: instagram,
    X: x,
};

function getPublisher(platform) {
    const name = String(platform || "").toUpperCase();
    const publisher = registry[name];
    if (!publisher) {
        throw new AppError(`Unsupported platform: ${name}`, 400);
    }
    return publisher;
}

module.exports = {
    getPublisher,
};
