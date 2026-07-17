CREATE TABLE "PublishCampaign" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "postId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "scheduledAt" DATETIME,
  "startedAt" DATETIME,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublishCampaign_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CampaignPublication" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "campaignId" INTEGER NOT NULL,
  "platform" TEXT NOT NULL,
  "destination" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "externalMessageId" TEXT,
  "publishedAt" DATETIME,
  "errorMessage" TEXT,
  "responseData" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CampaignPublication_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "PublishCampaign" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PublishCampaign_postId_status_idx"
ON "PublishCampaign"("postId", "status");

CREATE INDEX "PublishCampaign_createdAt_idx"
ON "PublishCampaign"("createdAt");

CREATE UNIQUE INDEX "CampaignPublication_campaignId_platform_key"
ON "CampaignPublication"("campaignId", "platform");

CREATE INDEX "CampaignPublication_platform_status_idx"
ON "CampaignPublication"("platform", "status");

CREATE INDEX "CampaignPublication_publishedAt_idx"
ON "CampaignPublication"("publishedAt");
