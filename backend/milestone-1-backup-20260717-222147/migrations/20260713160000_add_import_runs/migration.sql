CREATE TABLE "ImportRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "importType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fetchedCount" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "summaryPostId" INTEGER,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    "metadata" TEXT
);
CREATE INDEX "ImportRun_importType_idx" ON "ImportRun"("importType");
CREATE INDEX "ImportRun_status_idx" ON "ImportRun"("status");
CREATE INDEX "ImportRun_startedAt_idx" ON "ImportRun"("startedAt");
