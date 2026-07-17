CREATE TABLE "KnowledgeItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "author" TEXT,
    "publisher" TEXT,
    "reference" TEXT,
    "originalArabic" TEXT,
    "translation" TEXT,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "aiExplanation" TEXT,
    "aiCaption" TEXT,
    "aiHashtags" TEXT,
    "keywords" TEXT,
    "metadata" TEXT,
    "referenceQuality" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "confidenceScore" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "contentSourceId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeItem_contentSourceId_fkey" FOREIGN KEY ("contentSourceId") REFERENCES "ContentSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "KnowledgeReference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "knowledgeItemId" INTEGER NOT NULL,
    "referenceType" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "citation" TEXT,
    "collection" TEXT,
    "book" TEXT,
    "chapter" TEXT,
    "referenceNumber" TEXT,
    "authenticity" TEXT,
    "narrator" TEXT,
    "translationName" TEXT,
    "notes" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeReference_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "KnowledgeItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "KnowledgeAsset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "knowledgeItemId" INTEGER NOT NULL,
    "assetType" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "url" TEXT,
    "localPath" TEXT,
    "mimeType" TEXT,
    "prompt" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeAsset_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "KnowledgeItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "KnowledgeItem_slug_key" ON "KnowledgeItem"("slug");
CREATE UNIQUE INDEX "KnowledgeItem_externalId_key" ON "KnowledgeItem"("externalId");
CREATE UNIQUE INDEX "KnowledgeItem_contentSourceId_key" ON "KnowledgeItem"("contentSourceId");
CREATE INDEX "KnowledgeItem_type_status_idx" ON "KnowledgeItem"("type", "status");
CREATE INDEX "KnowledgeItem_category_idx" ON "KnowledgeItem"("category");
CREATE INDEX "KnowledgeItem_referenceQuality_idx" ON "KnowledgeItem"("referenceQuality");
CREATE INDEX "KnowledgeReference_knowledgeItemId_idx" ON "KnowledgeReference"("knowledgeItemId");
CREATE INDEX "KnowledgeReference_collection_referenceNumber_idx" ON "KnowledgeReference"("collection", "referenceNumber");
CREATE INDEX "KnowledgeAsset_knowledgeItemId_assetType_idx" ON "KnowledgeAsset"("knowledgeItemId", "assetType");
