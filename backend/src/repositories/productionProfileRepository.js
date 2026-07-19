const { withReadOnlyConnection } = require("../database/productionMysql");

const SAFE_PROFILE_COLUMNS = `
    id, profile_code, slug, age, gender, height, martial_status,
    education, degree, occupation, city, state, country,
    city_current, state_current, country_current,
    verification_status, created_on, updated
`;

const PUBLIC_FILTER = `
    is_active = 1
    AND is_open = 1
    AND profile_code IS NOT NULL
    AND profile_code <> ''
`;

async function findProfileBatchAfterId({ afterId = 0, limit = 250 } = {}) {
    const safeAfterId = Math.max(Number.parseInt(afterId, 10) || 0, 0);
    const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 250, 1), 5000);

    return withReadOnlyConnection(async (connection) => {
        const [rows] = await connection.execute(
            `SELECT ${SAFE_PROFILE_COLUMNS}
             FROM Profiles
             WHERE ${PUBLIC_FILTER}
               AND id > ?
             ORDER BY id ASC
             LIMIT ${safeLimit}`,
            [safeAfterId]
        );
        return rows;
    });
}

async function findRecentPublicProfiles(hours = 24, limit = 1000) {
    const safeHours = Math.min(Math.max(Number(hours) || 24, 1), 8760);
    const safeLimit = Math.min(Math.max(Number(limit) || 1000, 1), 5000);
    return withReadOnlyConnection(async (connection) => {
        const [rows] = await connection.query(
            `SELECT ${SAFE_PROFILE_COLUMNS}
             FROM Profiles
             WHERE ${PUBLIC_FILTER}
               AND created_on >= DATE_SUB(NOW(), INTERVAL ${safeHours} HOUR)
             ORDER BY id ASC
             LIMIT ${safeLimit}`
        );
        return rows;
    });
}

async function getPublicProfileStats() {
    return withReadOnlyConnection(async (connection) => {
        const [rows] = await connection.query(
            `SELECT COUNT(*) AS publicProfileCount,
                    COALESCE(MAX(id), 0) AS maxPublicProfileId,
                    MAX(created_on) AS newestCreatedOn,
                    MAX(updated) AS newestUpdatedOn
             FROM Profiles
             WHERE ${PUBLIC_FILTER}`
        );
        return rows[0];
    });
}

module.exports = {
    findProfileBatchAfterId,
    findRecentPublicProfiles,
    getPublicProfileStats,
};
