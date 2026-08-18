-- CreateTable
CREATE TABLE "Probe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
