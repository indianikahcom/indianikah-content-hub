CREATE TABLE "Publication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "destination" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "externalMessageId" TEXT,
    "publishedAt" DATETIME,
    "errorMessage" TEXT,
    "responseData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Publication_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Publication_postId_platform_key" ON "Publication"("postId", "platform");
CREATE INDEX "Publication_platform_idx" ON "Publication"("platform");
CREATE INDEX "Publication_status_idx" ON "Publication"("status");
CREATE INDEX "Publication_createdAt_idx" ON "Publication"("createdAt");
