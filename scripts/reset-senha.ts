#!/usr/bin/env node
/**
 * reset-senha.ts — CLI para redefinir senha de usuário em uma instância FluxoMed
 *
 * Uso:
 *   npx tsx scripts/reset-senha.ts <email> <nova-senha> [caminho-do-banco]
 *
 * O caminho do banco também pode ser definido via DATABASE_PATH ou DATABASE_URL.
 * Prioridade: argumento > DATABASE_PATH > DATABASE_URL
 *
 * Exemplos:
 *   npx tsx scripts/reset-senha.ts maria@exemplo.com "Nova@Senha123"
 *   npx tsx scripts/reset-senha.ts maria@exemplo.com "Nova@Senha123" /data/clinica-abc.db
 *   DATABASE_PATH=/data/clinica-abc.db npx tsx scripts/reset-senha.ts maria@exemplo.com "Nova@Senha123"
 *
 * Requer:
 *   - Node.js 22+
 *   - Prisma Client gerado (npm run db:generate ou prisma generate)
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

// ─── Mesmo formato de hash usado em apps/web/src/lib/auth.ts ────────────────
const HASH_PREFIX = "scrypt$";
const SALT_LEN = 16;
const KEY_LEN = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const derivedKey = scryptSync(password, salt, KEY_LEN);
  return `${HASH_PREFIX}${salt.toString("base64")}$${derivedKey.toString("base64")}`;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function usage(): void {
  console.error(`
Uso: npx tsx scripts/reset-senha.ts <email> <nova-senha> [caminho-do-banco]

Argumentos:
  email            Email do usuário (obrigatório)
  nova-senha       Nova senha em texto claro (obrigatório)
  caminho-do-banco Caminho para o arquivo SQLite (opcional se DATABASE_PATH ou DATABASE_URL estiver definido)

Variáveis de ambiente:
  DATABASE_PATH    Caminho para o arquivo SQLite
  DATABASE_URL     URL completa do banco (ex: file:/data/clinica.db)
`);
  process.exit(1);
}

async function main(): Promise<void> {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  const dbPathArg = process.argv[4];

  if (!email || !newPassword) {
    usage();
  }

  // Resolve a URL do banco: argumento > DATABASE_PATH > DATABASE_URL
  let databaseUrl: string | undefined;

  if (dbPathArg) {
    databaseUrl = `file:${dbPathArg}`;
  } else if (process.env.DATABASE_PATH) {
    databaseUrl = `file:${process.env.DATABASE_PATH}`;
  } else if (process.env.DATABASE_URL) {
    databaseUrl = process.env.DATABASE_URL;
  }

  if (!databaseUrl) {
    console.error("ERRO: Informe o caminho do banco como argumento ou via DATABASE_PATH/DATABASE_URL.");
    usage();
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error(`ERRO: Usuário com email "${email}" não encontrado.`);
      process.exit(1);
    }

    const passwordHash = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log(`Senha redefinida com sucesso para ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: Error) => {
  console.error("Erro:", err.message);
  process.exit(1);
});