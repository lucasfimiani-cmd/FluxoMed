-- CreateTable
CREATE TABLE "Atividade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fonteDeRendaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "valor" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Atividade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Atividade_fonteDeRendaId_fkey" FOREIGN KEY ("fonteDeRendaId") REFERENCES "FonteDeRenda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
