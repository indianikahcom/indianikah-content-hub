const INVALID_VALUES = new Set([
  "", "-", "--", ".", "0", "no", "none", "na", "n/a", "nil",
  "null", "unknown", "not applicable", "not mentioned", "not specified",
  "nothing", "dont know", "don't know",
]);

function clean(value) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized || null;
}

function normalized(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function usable(value) {
  const text = clean(value);
  if (!text || INVALID_VALUES.has(normalized(text))) return null;
  return text;
}

function first(profile, keys) {
  for (const key of keys) {
    const value = usable(profile?.[key]);
    if (value) return value;
  }
  return null;
}

function gender(value) {
  const v = normalized(value);
  if (["male", "m", "man", "boy"].includes(v)) return "Male";
  if (["female", "f", "woman", "girl"].includes(v)) return "Female";
  return null;
}

function ageGroup(value) {
  const age = Number.parseInt(value, 10);
  if (!Number.isInteger(age) || age < 18 || age > 100) return null;
  if (age <= 24) return "18–24";
  if (age <= 29) return "25–29";
  if (age <= 34) return "30–34";
  if (age <= 39) return "35–39";
  if (age <= 44) return "40–44";
  return "45+";
}

function add(map, key) {
  const value = usable(key);
  if (!value) return;
  map.set(value, (map.get(value) || 0) + 1);
}

function ranked(map) {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildProfileSummaryStats(profiles = [], options = {}) {
  const limit = Math.min(
    Math.max(Number.parseInt(options.topLimit, 10) || 5, 1),
    10
  );

  const maps = {
    gender: new Map(),
    ageGroups: new Map(),
    maritalStatus: new Map(),
    education: new Map(),
    occupation: new Map(),
    cities: new Map(),
    states: new Map(),
    countries: new Map(),
  };

  let verifiedProfiles = 0;

  for (const profile of profiles) {
    add(maps.gender, gender(profile.gender));
    add(maps.ageGroups, ageGroup(profile.age));
    add(
      maps.maritalStatus,
      first(profile, ["martial_status", "marital_status", "maritalStatus"])
    );
    add(maps.education, first(profile, ["degree", "education"]));
    add(maps.occupation, first(profile, ["occupation", "profession"]));
    add(maps.cities, first(profile, ["city_current", "city", "current_city"]));
    add(maps.states, first(profile, ["state_current", "state", "current_state"]));
    add(
      maps.countries,
      first(profile, ["country_current", "country", "current_country"])
    );

    const verification = normalized(
      first(profile, ["verification_status", "verificationStatus"]) || ""
    );
    if (["verified", "approved", "true", "1"].includes(verification)) {
      verifiedProfiles += 1;
    }
  }

  const result = {
    totalProfiles: profiles.length,
    verifiedProfiles,
  };

  for (const [key, map] of Object.entries(maps)) {
    result[key] = Object.fromEntries(
      ranked(map).map(({ label, count }) => [label, count])
    );
  }

  result.highlights = Object.fromEntries(
    Object.entries(maps).map(([key, map]) => [key, ranked(map).slice(0, limit)])
  );
  result.highlights.genders = result.highlights.gender;
  result.highlights.occupations = result.highlights.occupation;
  result.highlights.maritalStatuses = result.highlights.maritalStatus;

  return result;
}

module.exports = { buildProfileSummaryStats };
