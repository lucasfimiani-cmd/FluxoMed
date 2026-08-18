import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

// Use a temporaty SQLite database for integration tests
const tmpDbDir = path.resolve(__dirname, "..", "..", "..", ".tmp-test");
const tmpDbPath = path.join(tmpDbDir, "recorrencia-test.db");

let prisma: PrismaClient;

beforeAll(() => {
  fs.mkdirSync(tmpDbDir, { recursive: true });
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);

  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, "..", "..", ".."),
    env: {
      ...process.env,
      DATABASE_URL: `file:${tmpDbPath}`,
    },
    stdio: "pipe",
  });

  prisma = new PrismaClient({
    datasources: { db: { url: `file:${tmpDbPath}` } },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  fs.rmSync(tmpDbDir, { recursive: true, force: true });
});

async function criarFonteFixa(
  userId: string,
  overrides: Partial<{
    nome: string;
    valorMensal: number;
    ativa: boolean;
  }> = {}
) {
  const perfil = await prisma.perfilFiscal.create({
    data: {
      userId,
      tipo: "PF",
      regime: "PF_AUTONOMO",
      aliquotaEfetiva: 27.5,
    },
  });

  return prisma.fonteDeRenda.create({
    data: {
      userId,
      perfilFiscalId: perfil.id,
      nome: overrides.nome ?? "Fonte Teste",
      modelo: "FIXO_MENSAL",
      valorMensal: overrides.valorMensal ?? 5000,
      ativa: overrides.ativa ?? true,
      prazoPagamentoDias: 30,
    },
  });
}

describe("garantirAtividadesRecorrentes", () => {
  it("deve gerar atividade para fonte FIXO_MENSAL ativa", async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        name: "Test User",
        passwordHash: "hash",
      },
    });
    const fonte = await criarFonteFixa(user.id);

    const { garantirAtividadesRecorrentes } = await import("./recorrencia");
    await garantirAtividadesRecorrentes(user.id, 2026, 8, prisma as any);

    const atividades = await prisma.atividade.findMany({
      where: { userId: user.id },
    });
    expect(atividades).toHaveLength(1);
    expect(atividades[0].fonteDeRendaId).toBe(fonte.id);
    expect(atividades[0].tipo).toBe("OUTRO");
    expect(atividades[0].status).toBe("REALIZADA");
    expect(atividades[0].valor).toBe(5000);
    expect(atividades[0].data.getMonth()).toBe(7); // Agosto = 7 (0-indexed)
    expect(atividades[0].data.getDate()).toBe(1);

    const recorrencia = await prisma.recorrenciaGerada.findUnique({
      where: {
        fonteDeRendaId_ano_mes: {
          fonteDeRendaId: fonte.id,
          ano: 2026,
          mes: 8,
        },
      },
    });
    expect(recorrencia).not.toBeNull();
    expect(recorrencia!.atividadeId).toBe(atividades[0].id);
  });

  it("deve ser idempotente — chamar 2x não duplica", async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        name: "Test User",
        passwordHash: "hash",
      },
    });
    const fonte = await criarFonteFixa(user.id);

    const { garantirAtividadesRecorrentes } = await import("./recorrencia");
    await garantirAtividadesRecorrentes(user.id, 2026, 8, prisma as any);
    await garantirAtividadesRecorrentes(user.id, 2026, 8, prisma as any); // 2ª vez

    const atividades = await prisma.atividade.findMany({
      where: { userId: user.id },
    });
    expect(atividades).toHaveLength(1);

    const recorrencias = await prisma.recorrenciaGerada.findMany({
      where: { fonteDeRendaId: fonte.id },
    });
    expect(recorrencias).toHaveLength(1);
  });

  it("não deve gerar para fonte inativa", async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        name: "Test User",
        passwordHash: "hash",
      },
    });
    await criarFonteFixa(user.id, { ativa: false });

    const { garantirAtividadesRecorrentes } = await import("./recorrencia");
    await garantirAtividadesRecorrentes(user.id, 2026, 8, prisma as any);

    const atividades = await prisma.atividade.findMany({
      where: { userId: user.id },
    });
    expect(atividades).toHaveLength(0);
  });

  it("não deve gerar para modelo POR_ATIVIDADE", async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        name: "Test User",
        passwordHash: "hash",
      },
    });
    const perfil = await prisma.perfilFiscal.create({
      data: {
        userId: user.id,
        tipo: "PF",
        regime: "PF_AUTONOMO",
        aliquotaEfetiva: 27.5,
      },
    });
    await prisma.fonteDeRenda.create({
      data: {
        userId: user.id,
        perfilFiscalId: perfil.id,
        nome: "Por Ativ Teste",
        modelo: "POR_ATIVIDADE",
        valorPorAtividade: 1000,
        ativa: true,
        prazoPagamentoDias: 30,
      },
    });

    const { garantirAtividadesRecorrentes } = await import("./recorrencia");
    await garantirAtividadesRecorrentes(user.id, 2026, 8, prisma as any);

    const atividades = await prisma.atividade.findMany({
      where: { userId: user.id },
    });
    expect(atividades).toHaveLength(0);
  });

  it("não deve gerar para modelo POR_UNIDADE", async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        name: "Test User",
        passwordHash: "hash",
      },
    });
    const perfil = await prisma.perfilFiscal.create({
      data: {
        userId: user.id,
        tipo: "PF",
        regime: "PF_AUTONOMO",
        aliquotaEfetiva: 27.5,
      },
    });
    await prisma.fonteDeRenda.create({
      data: {
        userId: user.id,
        perfilFiscalId: perfil.id,
        nome: "Por Unid Teste",
        modelo: "POR_UNIDADE",
        ativa: true,
        prazoPagamentoDias: 30,
        precos: {
          create: [{ tipo: "PLANTAO", valor: 1500 }],
        },
      },
    });

    const { garantirAtividadesRecorrentes } = await import("./recorrencia");
    await garantirAtividadesRecorrentes(user.id, 2026, 8, prisma as any);

    const atividades = await prisma.atividade.findMany({
      where: { userId: user.id },
    });
    expect(atividades).toHaveLength(0);
  });

  it("deve gerar para mês diferente (backfill)", async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        name: "Test User",
        passwordHash: "hash",
      },
    });
    const fonte = await criarFonteFixa(user.id);

    const { garantirAtividadesRecorrentes } = await import("./recorrencia");
    await garantirAtividadesRecorrentes(user.id, 2026, 8, prisma as any);
    await garantirAtividadesRecorrentes(user.id, 2026, 9, prisma as any);

    const atividades = await prisma.atividade.findMany({
      where: { userId: user.id },
      orderBy: { data: "asc" },
    });
    expect(atividades).toHaveLength(2);
    expect(atividades[0].data.getMonth()).toBe(7); // Agosto
    expect(atividades[1].data.getMonth()).toBe(8); // Setembro

    const recorrencias = await prisma.recorrenciaGerada.findMany({
      where: { fonteDeRendaId: fonte.id },
    });
    expect(recorrencias).toHaveLength(2);
  });
});