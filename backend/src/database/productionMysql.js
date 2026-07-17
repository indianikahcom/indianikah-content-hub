const mysql = require("mysql2/promise");

let pool;

function getProductionPool() {
    if (!pool) {
        const required = ["PROD_DB_HOST", "PROD_DB_NAME", "PROD_DB_USER", "PROD_DB_PASSWORD"];
        const missing = required.filter((key) => !process.env[key]);
        if (missing.length) {
            throw new Error(`Missing production database configuration: ${missing.join(", ")}`);
        }

        pool = mysql.createPool({
            host: process.env.PROD_DB_HOST,
            port: Number(process.env.PROD_DB_PORT || 3306),
            database: process.env.PROD_DB_NAME,
            user: process.env.PROD_DB_USER,
            password: process.env.PROD_DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: Number(process.env.PROD_DB_POOL_SIZE || 3),
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            timezone: "Z"
        });
    }
    return pool;
}

async function testProductionConnection() {
    const connection = await getProductionPool().getConnection();
    try {
        const [rows] = await connection.query("SELECT CURRENT_USER() AS currentUser, DATABASE() AS databaseName");
        return rows[0];
    } finally {
        connection.release();
    }
}

module.exports = { getProductionPool, testProductionConnection };
