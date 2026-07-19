const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const { PrismaClient } = require("@prisma/client");
const {
    PrismaBetterSqlite3
} = require("@prisma/adapter-better-sqlite3");

const databaseUrl =
    process.env.DATABASE_URL ||
    "file:./prisma/dev.db";

const adapter = new PrismaBetterSqlite3({
    url: databaseUrl
});

const prisma = new PrismaClient({
    adapter
});

module.exports = prisma;
