-- CreateTable
CREATE TABLE "Recebimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fonteDeRendaId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "valor" REAL NOT NULL,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recebimento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recebimento_fonteDeRendaId_fkey" FOREIGN KEY ("fonteDeRendaId") REFERENCES "FonteDeRenda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AtividadeToRecebimento" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AtividadeToRecebimento_A_fkey" FOREIGN KEY ("A") REFERENCES "Atividade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AtividadeToRecebimento_B_fkey" FOREIGN KEY ("B") REFERENCES "Recebimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_AtividadeToRecebimento_AB_unique" ON "_AtividadeToRecebimento"("A", "B");

-- CreateIndex
CREATE INDEX "_AtividadeToRecebimento_B_index" ON "_AtividadeToRecebimento"("B");
