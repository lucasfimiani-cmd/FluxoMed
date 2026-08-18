-- CreateTable
CREATE TABLE "RecorrenciaGerada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fonteDeRendaId" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecorrenciaGerada_fonteDeRendaId_fkey" FOREIGN KEY ("fonteDeRendaId") REFERENCES "FonteDeRenda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecorrenciaGerada_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RecorrenciaGerada_atividadeId_key" ON "RecorrenciaGerada"("atividadeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecorrenciaGerada_fonteDeRendaId_ano_mes_key" ON "RecorrenciaGerada"("fonteDeRendaId", "ano", "mes");
