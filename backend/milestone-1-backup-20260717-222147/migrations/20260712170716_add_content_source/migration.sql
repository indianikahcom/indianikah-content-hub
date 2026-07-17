-- CreateTable
CREATE TABLE "ContentSource" (
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

-- CreateIndex
CREATE INDEX "ContentSource_type_idx" ON "ContentSource"("type");

-- CreateIndex
CREATE INDEX "ContentSource_status_idx" ON "ContentSource"("status");

-- CreateIndex
CREATE INDEX "ContentSource_externalId_idx" ON "ContentSource"("externalId");
