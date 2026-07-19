const MODES = Object.freeze({
    MANUAL_APPROVAL: "MANUAL_APPROVAL",
    FULL_AUTO: "FULL_AUTO",
});

function booleanEnv(name, fallback = false) {
    const value = process.env[name];
    if (value === undefined) return fallback;
    return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function integerEnv(name, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const parsed = Number.parseInt(process.env[name], 10);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
}

function csvEnv(name, fallback = []) {
    const raw = process.env[name];
    if (!raw) return fallback;
    return raw
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);
}

function getAutomationConfig() {
    const requestedMode = String(
        process.env.CONTENT_AUTOMATION_MODE || MODES.MANUAL_APPROVAL
    ).toUpperCase();

    const mode = Object.values(MODES).includes(requestedMode)
        ? requestedMode
        : MODES.MANUAL_APPROVAL;

    return {
        mode,
        autoApproveEnabled:
            mode === MODES.FULL_AUTO &&
            booleanEnv("AUTO_APPROVE_ENABLED", false),
        autoPublishEnabled:
            mode === MODES.FULL_AUTO &&
            booleanEnv("AUTO_PUBLISH_ENABLED", false),
        schedulerEnabled: booleanEnv(
            "CONTENT_QUEUE_SCHEDULER_ENABLED",
            false
        ),
        profileSummarySchedulerEnabled: booleanEnv(
            "PROFILE_SUMMARY_SCHEDULER_ENABLED",
            false
        ),
        profileSummaryHourIst: integerEnv(
            "PROFILE_SUMMARY_HOUR_IST",
            9,
            0,
            23
        ),
        profileSummaryMinuteIst: integerEnv(
            "PROFILE_SUMMARY_MINUTE_IST",
            0,
            0,
            59
        ),
        queueIntervalMinutes: integerEnv(
            "CONTENT_QUEUE_INTERVAL_MINUTES",
            5,
            1,
            1440
        ),
        maxAutoPostsPerDay: integerEnv(
            "MAX_AUTO_POSTS_PER_DAY",
            3,
            1,
            100
        ),
        maxPublishRetries: integerEnv(
            "MAX_PUBLISH_RETRIES",
            3,
            0,
            10
        ),
        retryDelayMinutes: integerEnv(
            "PUBLISH_RETRY_DELAY_MINUTES",
            15,
            1,
            1440
        ),
        stopPlatformAfterFailures: integerEnv(
            "STOP_PLATFORM_AFTER_FAILURES",
            3,
            1,
            100
        ),
        enabledPlatforms: csvEnv("ENABLED_PUBLISH_PLATFORMS", [
            "TELEGRAM",
            "FACEBOOK",
            "LINKEDIN",
            "INSTAGRAM",
        ]),
        emailReportEnabled: booleanEnv(
            "SEND_PUBLISH_EMAIL_REPORT",
            true
        ),
    };
}

module.exports = {
    MODES,
    getAutomationConfig,
};
