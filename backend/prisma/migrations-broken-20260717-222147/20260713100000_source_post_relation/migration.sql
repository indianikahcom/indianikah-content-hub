PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ContentSource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "rawContent" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ContentSource" ("createdAt", "externalId", "id", "metadata", "rawContent", "sourceUrl", "status", "title", "type", "updatedAt") SELECT "createdAt", "externalId", "id", "metadata", "rawContent", "sourceUrl", "status", "title", "type", "updatedAt" FROM "ContentSource";
DROP TABLE "ContentSource";
ALTER TABLE "new_ContentSource" RENAME TO "ContentSource";
CREATE UNIQUE INDEX "ContentSource_externalId_key" ON "ContentSource"("externalId");
CREATE INDEX "ContentSource_type_idx" ON "ContentSource"("type");
CREATE INDEX "ContentSource_status_idx" ON "ContentSource"("status");

CREATE TABLE "new_Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sourceId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("content", "createdAt", "id", "status", "title", "updatedAt") SELECT "content", "createdAt", "id", "status", "title", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_sourceId_key" ON "Post"("sourceId");
CREATE INDEX "Post_status_idx" ON "Post"("status");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
