const assert = require("node:assert/strict");
const { createTemplateDraft } = require("../src/services/milestone3TemplateService");
const { PLATFORMS } = require("../src/services/platformComposerService");

const source = {
    type: "PROFILE",
    title: "IndiaNikah profile 123456",
    sourceUrl: "https://indianikah.com/profile/example",
    rawContent: "Age: 30",
    metadata: JSON.stringify({ age: 30, gender: "Female", maritalStatus: "Never Married", education: "Graduate", city: "PUNE", state: "Maharashtra" })
};

const draft = createTemplateDraft(source);
assert.ok(draft.title.includes("PUNE"));
assert.ok(draft.content.includes("30 years"));
assert.ok(draft.content.includes("100% free forever"));
assert.ok(!draft.content.toLowerCase().includes("email"));
assert.deepEqual(PLATFORMS, ["FACEBOOK", "INSTAGRAM", "X", "LINKEDIN", "TELEGRAM", "WHATSAPP", "YOUTUBE"]);
console.log("Milestone 3 local smoke test passed.");
