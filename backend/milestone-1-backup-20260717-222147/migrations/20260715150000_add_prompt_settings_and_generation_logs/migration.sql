-- CreateTable
CREATE TABLE "PromptSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" INTEGER,
    "sourceId" INTEGER,
    "contentType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL,
    "promptKey" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "PromptSetting_key_key" ON "PromptSetting"("key");
CREATE INDEX "GenerationLog_contentType_idx" ON "GenerationLog"("contentType");
CREATE INDEX "GenerationLog_status_idx" ON "GenerationLog"("status");
CREATE INDEX "GenerationLog_createdAt_idx" ON "GenerationLog"("createdAt");
