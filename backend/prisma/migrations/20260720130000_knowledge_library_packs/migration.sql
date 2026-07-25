CREATE TABLE "KnowledgePack" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "instructions" TEXT,
  "contentTypes" JSONB,
  "languages" JSONB,
  "tags" JSONB,
  "maxItems" INTEGER NOT NULL DEFAULT 8,
  "maxCharacters" INTEGER NOT NULL DEFAULT 12000,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "KnowledgePack_key_key" ON "KnowledgePack"("key");
CREATE INDEX "KnowledgePack_isActive_idx" ON "KnowledgePack"("isActive");

CREATE TABLE "KnowledgePackItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "packId" INTEGER NOT NULL,
  "knowledgeItemId" INTEGER NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgePackItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "KnowledgePack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "KnowledgePackItem_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "KnowledgeItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "KnowledgePackItem_packId_knowledgeItemId_key" ON "KnowledgePackItem"("packId", "knowledgeItemId");
CREATE INDEX "KnowledgePackItem_packId_priority_idx" ON "KnowledgePackItem"("packId", "priority");
CREATE INDEX "KnowledgePackItem_knowledgeItemId_idx" ON "KnowledgePackItem"("knowledgeItemId");

CREATE TABLE "KnowledgeContextLog" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "query" TEXT NOT NULL,
  "packId" INTEGER,
  "knowledgeItemId" INTEGER,
  "score" REAL,
  "generationType" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeContextLog_packId_fkey" FOREIGN KEY ("packId") REFERENCES "KnowledgePack" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "KnowledgeContextLog_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "KnowledgeItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "KnowledgeContextLog_createdAt_idx" ON "KnowledgeContextLog"("createdAt");
CREATE INDEX "KnowledgeContextLog_packId_idx" ON "KnowledgeContextLog"("packId");
CREATE INDEX "KnowledgeContextLog_knowledgeItemId_idx" ON "KnowledgeContextLog"("knowledgeItemId");
