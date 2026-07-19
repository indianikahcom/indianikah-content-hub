const assert = require("assert");
const { buildProfileSummaryStats } = require("../src/services/profileSummaryStatsService");
const { buildSummaryPost } = require("../src/services/profileSummaryTemplateService");

const profiles = [
  { gender: "male", age: 28, occupation: "Business", degree: "B.Com", city_current: "Pune", state_current: "Maharashtra", martial_status: "Never Married" },
  { gender: "female", age: 25, occupation: "Teacher", education: "Graduate", city_current: "Mumbai", state_current: "Maharashtra", martial_status: "Never Married" },
  { gender: "male", age: 31, occupation: "Business", degree: "MBA", city_current: "Pune", state_current: "Maharashtra", martial_status: "Divorced" },
];

const stats = buildProfileSummaryStats(profiles, { topLimit: 5 });
const post = buildSummaryPost(stats, { hours: 24 });

assert.equal(stats.totalProfiles, 3);
assert.match(post.content, /👥 Gender/);
assert.match(post.content, /💼 Occupations/);
assert.match(post.content, /🎓 Education/);
assert.doesNotMatch(post.content, /\(\d+(?:\.\d+)?%\)/);
assert.doesNotMatch(post.content, /Gender-wise|Occupation-wise|Education-wise/);
assert.match(post.content, /Anonymous statistics only/);
console.log("Backend stabilization smoke test passed.");
