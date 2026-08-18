import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRecebimentoAggregate = vi.fn();
const mockAtividadeFindMany = vi.fn();
const mockFonteDeRendaFindMany = vi.fn();
const mockRecebimentoFindMany = vi.fn();
const mockContasAReceberDaFonte = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recebimento: {
      aggregate: mockRecebimentoAggregate,
      findMany: mockRecebimentoFindMany,
    },
    atividade: {
      findMany: mockAtividadeFindMany,
    },
    fonteDeRenda: {
      findMany: mockFonteDeRendaFindMany,
    },
  },
}));

vi.mock("@/lib/recebimentos/ajuste", () => ({
  contasAReceberDaFonte: mockContasAReceberDaFonte,
}));

// Dynamic import after mocks are set up
async function importModule() {
  return import("./dashboard");
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── realizado ───────────────────────────────────────────────────────────────

describe("realizado", () => {
  it("deve somar recebimentos do mês", async () => {
    mockRecebimentoAggregate.mockResolvedValue({ _sum: { valor: 5000 } });

    const { realizado } = await importModule();
    const result = await realizado("2026-08", "user1");

    expect(mockRecebimentoAggregate).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        data: {
          gte: new Date(2026, 7, 1, 0, 0, 0),
          lte: new Date(2026, 7, 31, 23, 59, 59, 999),
        },
      },
      _sum: { valor: true },
    });
    expect(result).toBe(5000);
  });

  it("deve retornar 0 quando não há recebimentos no mês", async () => {
    mockRecebimentoAggregate.mockResolvedValue({ _sum: { valor: null } });

    const { realizado } = await importModule();
    const result = await realizado("2026-09", "user1");
    expect(result).toBe(0);
  });
});

// ─── projetado ───────────────────────────────────────────────────────────────

describe("projetado", () => {
  it("deve incluir atividade com prazo 0 no mesmo mês", async () => {
    mockAtividadeFindMany.mockResolvedValue([
      {
        id: "a1",
        valor: 1000,
        data: new Date(2026, 7, 15, 12, 0, 0),
        fonteDeRenda: { prazoPagamentoDias: 0 },
      },
    ]);

    const { projetado } = await importModule();
    const result = await projetado("2026-08", "user1");
    expect(result).toBe(1000);
  });

  it("deve deslocar atividade com prazo 30 para o mês seguinte", async () => {
    mockAtividadeFindMany.mockResolvedValue([
      {
        id: "a1",
        valor: 1000,
        data: new Date(2026, 7, 15, 12, 0, 0),
        fonteDeRenda: { prazoPagamentoDias: 30 },
      },
    ]);

    const { projetado } = await importModule();
    const resultAug = await projetado("2026-08", "user1");
    expect(resultAug).toBe(0);

    const resultSep = await projetado("2026-09", "user1");
    expect(resultSep).toBe(1000);
  });

  it("deve deslocar atividade com prazo 60 para dois meses depois", async () => {
    mockAtividadeFindMany.mockResolvedValue([
      {
        id: "a1",
        valor: 2000,
        data: new Date(2026, 7, 1, 12, 0, 0),
        fonteDeRenda: { prazoPagamentoDias: 60 },
      },
    ]);

    const { projetado } = await importModule();
    const resultAug = await projetado("2026-08", "user1");
    expect(resultAug).toBe(0);

    const resultSep = await projetado("2026-09", "user1");
    expect(resultSep).toBe(2000);
  });

  it("deve excluir atividades vinculadas a recebimento (RECEBIDA)", async () => {
    mockAtividadeFindMany.mockResolvedValue([]);

    const { projetado } = await importModule();
    await projetado("2026-08", "user1");

    const callArgs = mockAtividadeFindMany.mock.calls[0][0];
    expect(callArgs.where.recebimentos).toEqual({ none: {} });
  });
});

// ─── contasAReceberPorFonte ──────────────────────────────────────────────────

describe("contasAReceberPorFonte", () => {
  it("deve retornar fontes com atividades a receber", async () => {
    mockFonteDeRendaFindMany.mockResolvedValue([
      { id: "f1", nome: "Fonte 1", prazoPagamentoDias: 30 },
    ]);
    mockContasAReceberDaFonte.mockResolvedValue([
      { id: "a1", valor: 1500, data: new Date(2026, 7, 10) },
      { id: "a2", valor: 2500, data: new Date(2026, 7, 15) },
    ]);

    const { contasAReceberPorFonte } = await importModule();
    const result = await contasAReceberPorFonte("user1");

    expect(result).toHaveLength(1);
    expect(result[0].fonteNome).toBe("Fonte 1");
    expect(result[0].total).toBe(4000);
    expect(result[0].atividades).toHaveLength(2);
  });

  it("deve excluir fontes sem atividades a receber", async () => {
    mockFonteDeRendaFindMany.mockResolvedValue([
      { id: "f1", nome: "Fonte 1", prazoPagamentoDias: 30 },
    ]);
    mockContasAReceberDaFonte.mockResolvedValue([]);

    const { contasAReceberPorFonte } = await importModule();
    const result = await contasAReceberPorFonte("user1");
    expect(result).toHaveLength(0);
  });
});

// ─── liquidoEstimado ─────────────────────────────────────────────────────────

describe("liquidoEstimado", () => {
  it("deve aplicar alíquota sobre recebimentos do mês", async () => {
    mockRecebimentoFindMany.mockResolvedValue([
      {
        id: "r1",
        valor: 10000,
        fonteDeRenda: {
          perfilFiscal: { aliquotaEfetiva: 27.5 },
        },
      },
    ]);

    const { liquidoEstimado } = await importModule();
    const result = await liquidoEstimado("2026-08", "user1");

    expect(result).toBe(7250);
  });

  it("deve somar múltiplos recebimentos com alíquotas diferentes", async () => {
    mockRecebimentoFindMany.mockResolvedValue([
      {
        id: "r1",
        valor: 5000,
        fonteDeRenda: {
          perfilFiscal: { aliquotaEfetiva: 27.5 },
        },
      },
      {
        id: "r2",
        valor: 3000,
        fonteDeRenda: {
          perfilFiscal: { aliquotaEfetiva: 15 },
        },
      },
    ]);

    const { liquidoEstimado } = await importModule();
    const result = await liquidoEstimado("2026-08", "user1");

    expect(result).toBe(6175);
  });

  it("deve retornar 0 quando não há recebimentos no mês", async () => {
    mockRecebimentoFindMany.mockResolvedValue([]);

    const { liquidoEstimado } = await importModule();
    const result = await liquidoEstimado("2026-08", "user1");
    expect(result).toBe(0);
  });
});