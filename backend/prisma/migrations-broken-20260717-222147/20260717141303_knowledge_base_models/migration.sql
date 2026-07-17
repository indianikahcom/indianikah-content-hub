/*
  Warnings:

  - You are about to drop the `KnowledgeAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KnowledgeItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KnowledgeReference` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "KnowledgeAsset";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "KnowledgeItem";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "KnowledgeReference";
PRAGMA foreign_keys=on;
