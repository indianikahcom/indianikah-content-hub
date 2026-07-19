/* eslint-disable no-console */
require("dotenv").config();
const assert = require("node:assert/strict");
const profileImportService = require("../src/services/profileImportService");
const sourceRepository = require("../src/repositories/sourceRepository");
const prisma = require("../src/database/prisma");

async function main() {
    const summary = profileImportService.buildDailySummary([
        { id: 1, profile_code: "TEST001", age: 28, gender: "female", martial_status: "never married", education: "Graduate", degree: "MBA", occupation: "Engineer", city: "Pune", state: "Maharashtra", country: "India" },
        { id: 2, profile_code: "TEST002", age: 31, gender: "male", martial_status: "divorced", education: "Graduate", degree: "B.Tech", occupation: "Teacher", city: "Mumbai", state: "Maharashtra", country: "India" },
    ]);
    assert.match(summary.title, /2 new profiles/);
    assert.match(summary.content, /Male \/ Female/);
    assert.match(summary.content, /Maharashtra/);

    const none = await sourceRepository.findExistingExternalIds([]);
    assert.equal(none.size, 0);

    console.log("Milestone 2 local smoke test passed.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
