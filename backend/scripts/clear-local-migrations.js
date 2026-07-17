const Database = require("better-sqlite3");
const db = new Database("./prisma/dev.db");
const exists = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'"
).get();
if (exists) db.prepare("DELETE FROM _prisma_migrations").run();
db.close();