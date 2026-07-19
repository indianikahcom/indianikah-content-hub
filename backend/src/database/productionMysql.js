const mysql = require("mysql2/promise");
const AppError = require("../errors/AppError");

let pool;

function readPositiveInteger(name, fallback, max) {
    const value = Number(process.env[name] || fallback);
    if (!Number.isInteger(value) || value < 1 || value > max) return fallback;
    return value;
}

function assertProductionConfig() {
    const required = ["PROD_DB_HOST", "PROD_DB_NAME", "PROD_DB_USER", "PROD_DB_PASSWORD"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
        throw new AppError(`Missing production database configuration: ${missing.join(", ")}`, 503);
    }
}

function getProductionPool() {
    if (!pool) {
        assertProductionConfig();
        pool = mysql.createPool({
            host: process.env.PROD_DB_HOST,
            port: readPositiveInteger("PROD_DB_PORT", 3306, 65535),
            database: process.env.PROD_DB_NAME,
            user: process.env.PROD_DB_USER,
            password: process.env.PROD_DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: readPositiveInteger("PROD_DB_POOL_SIZE", 3, 10),
            queueLimit: readPositiveInteger("PROD_DB_QUEUE_LIMIT", 20, 1000),
            connectTimeout: readPositiveInteger("PROD_DB_CONNECT_TIMEOUT_MS", 10000, 60000),
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            timezone: "Z",
            dateStrings: false,
            namedPlaceholders: false,
            multipleStatements: false,
        });
    }
    return pool;
}

async function withReadOnlyConnection(callback) {
    const connection = await getProductionPool().getConnection();
    try {
        await connection.query("SET SESSION TRANSACTION READ ONLY");
        return await callback(connection);
    } finally {
        connection.release();
    }
}

async function testProductionConnection() {
    return withReadOnlyConnection(async (connection) => {
        const [rows] = await connection.query(`
            SELECT CURRENT_USER() AS currentUser,
                   DATABASE() AS databaseName,
                   @@hostname AS databaseHost,
                   @@version AS databaseVersion,
                   @@session.transaction_read_only AS transactionReadOnly
        `);
        return rows[0];
    });
}

async function closeProductionPool() {
    if (pool) {
        await pool.end();
        pool = undefined;
    }
}

module.exports = {
    getProductionPool,
    withReadOnlyConnection,
    testProductionConnection,
    closeProductionPool,
};
