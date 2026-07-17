const { enabledPlatforms, testFacebookConnection, testLinkedinConnection } = require("../services/platformPublishers");

async function list(req, res, next) {
    try {
        const configured = enabledPlatforms();
        return res.json({ success: true, data: [
            { platform: "TELEGRAM", enabled: configured.includes("TELEGRAM"), configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) },
            { platform: "FACEBOOK", enabled: configured.includes("FACEBOOK"), configured: Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN) },
            { platform: "LINKEDIN", enabled: configured.includes("LINKEDIN"), configured: Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_ORGANIZATION_ID) },
            { platform: "INSTAGRAM", enabled: configured.includes("INSTAGRAM"), configured: Boolean(process.env.INSTAGRAM_USER_ID && process.env.INSTAGRAM_SYSTEM_USER_TOKEN) },
            { platform: "X", enabled: configured.includes("X"), configured: false },
            { platform: "YOUTUBE", enabled: configured.includes("YOUTUBE"), configured: false },
            { platform: "WHATSAPP", enabled: configured.includes("WHATSAPP"), configured: false },
        ]});
    } catch (error) { next(error); }
}

async function testFacebook(req, res, next) {
    try { return res.json({ success: true, message: "Facebook Page connection is working", data: await testFacebookConnection() }); }
    catch (error) { next(error); }
}

async function testLinkedin(req, res, next) {
    try { return res.json({ success: true, message: "LinkedIn organization connection is working", data: await testLinkedinConnection() }); }
    catch (error) { next(error); }
}

module.exports = { list, testFacebook, testLinkedin };
