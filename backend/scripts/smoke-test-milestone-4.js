const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";

async function request(path, options) {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            `${response.status} ${path}: ${JSON.stringify(body)}`
        );
    }

    return body;
}

async function main() {
    const health = await request("/api/health");
    if (!health) throw new Error("Health endpoint returned no data");

    const preview = await request(
        "/api/profile-summaries/daily/preview?hours=24&topLimit=5"
    );

    if (!preview.success) {
        throw new Error("Profile summary preview was unsuccessful");
    }

    const dryRun = await request(
        "/api/profile-summaries/daily/generate",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                hours: 24,
                topLimit: 5,
                dryRun: true,
                composePlatforms: true,
            }),
        }
    );

    if (!dryRun.success || dryRun.data?.dryRun !== true) {
        throw new Error("Profile summary dry run was unsuccessful");
    }

    if (!Array.isArray(dryRun.data?.variants)) {
        throw new Error("Platform variants were not generated");
    }

    console.log("Milestone 4 profile summary smoke test passed.");
    console.log(
        JSON.stringify(
            {
                totalProfiles:
                    dryRun.data?.stats?.totalProfiles ??
                    dryRun.data?.statistics?.totalProfiles,
                variantCount: dryRun.data?.variants?.length,
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
