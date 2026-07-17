CREATE TABLE "ContentQueueItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "postId" INTEGER NOT NULL,
  "contentType" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'ALL',
  "status" TEXT NOT NULL DEFAULT 'READY',
  "priority" INTEGER NOT NULL DEFAULT 100,
  "scheduledAt" DATETIME,
  "approvedAt" DATETIME,
  "publishedAt" DATETIME,
  "publishedCampaignId" INTEGER,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ContentQueueItem_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContentQueueItem_status_scheduledAt_idx"
ON "ContentQueueItem"("status", "scheduledAt");

CREATE INDEX "ContentQueueItem_contentType_status_idx"
ON "ContentQueueItem"("contentType", "status");

CREATE INDEX "ContentQueueItem_postId_idx"
ON "ContentQueueItem"("postId");

CREATE INDEX "ContentQueueItem_createdAt_idx"
ON "ContentQueueItem"("createdAt");
