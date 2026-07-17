-- CreateTable
CREATE TABLE "KnowledgeItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT,
    "subcategory" TEXT,
    "metadata" JSONB,
    "references" JSONB,
    "tags" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sourceId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "KnowledgeItem_type_idx" ON "KnowledgeItem"("type");

-- CreateIndex
CREATE INDEX "KnowledgeItem_status_idx" ON "KnowledgeItem"("status");

-- CreateIndex
CREATE INDEX "KnowledgeItem_language_idx" ON "KnowledgeItem"("language");

-- CreateIndex
CREATE INDEX "KnowledgeItem_category_idx" ON "KnowledgeItem"("category");

-- CreateIndex
CREATE INDEX "KnowledgeItem_subcategory_idx" ON "KnowledgeItem"("subcategory");

-- CreateIndex
CREATE INDEX "KnowledgeItem_createdAt_idx" ON "KnowledgeItem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeItem_type_title_language_key" ON "KnowledgeItem"("type", "title", "language");
