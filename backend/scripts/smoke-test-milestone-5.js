const base =
    process.env.SMOKE_BASE_URL || "http://localhost:3000";

async function call(path, options) {
    const response = await fetch(base + path, options);
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            `${response.status} ${path}: ${JSON.stringify(body)}`
        );
    }

    return body;
}

async function main() {
    await call("/api/health");

    const status = await call(
        "/api/publishing/automation/status"
    );

    if (!status.success) {
        throw new Error(
            "Automation status did not return success=true"
        );
    }

    if (
        status.data.mode !== "MANUAL_APPROVAL" &&
        status.data.mode !== "FULL_AUTO"
    ) {
        throw new Error("Invalid automation mode");
    }

    console.log("Milestone 5 smoke test passed.");
    console.log(
        JSON.stringify(
            {
                mode: status.data.mode,
                autoApproveEnabled:
                    status.data.autoApproveEnabled,
                autoPublishEnabled:
                    status.data.autoPublishEnabled,
                schedulerEnabled:
                    status.data.schedulerEnabled,
                enabledPlatforms:
                    status.data.enabledPlatforms,
            },
            null,
            2
        )
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
