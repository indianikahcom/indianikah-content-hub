const { getProductionPool } = require("../database/productionMysql");

const SAFE_PROFILE_COLUMNS = `
    id, profile_code, slug, age, gender, height, martial_status,
    education, degree, occupation, city, state, country,
    city_current, state_current, country_current, created_on
`;

async function findRecentPublicProfiles(hours = 24) {
    const safeHours = Math.min(Math.max(Number(hours) || 24, 1), 168);
    const [rows] = await getProductionPool().execute(
        `SELECT ${SAFE_PROFILE_COLUMNS}
         FROM Profiles
         WHERE is_active = 1
           AND is_open = 1
           AND created_on >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         ORDER BY created_on ASC`,
        [safeHours]
    );
    return rows;
}

module.exports = { findRecentPublicProfiles };
