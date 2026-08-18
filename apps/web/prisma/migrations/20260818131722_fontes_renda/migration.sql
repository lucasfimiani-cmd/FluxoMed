-- CreateTable
CREATE TABLE "FonteDeRenda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "perfilFiscalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "valorMensal" REAL,
    "valorPorAtividade" REAL,
    "prazoPagamentoDias" INTEGER NOT NULL DEFAULT 30,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FonteDeRenda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FonteDeRenda_perfilFiscalId_fkey" FOREIGN KEY ("perfilFiscalId") REFERENCES "PerfilFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrecoAtividade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fonteDeRendaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    CONSTRAINT "PrecoAtividade_fonteDeRendaId_fkey" FOREIGN KEY ("fonteDeRendaId") REFERENCES "FonteDeRenda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PrecoAtividade_fonteDeRendaId_tipo_key" ON "PrecoAtividade"("fonteDeRendaId", "tipo");
