import { describe, it, expect } from "vitest";
import { calcularAjuste, formatarAjuste } from "./ajuste";
import { statusEfetivo, estaVinculada } from "./status";
import { CriarRecebimentoSchema } from "@fluxomed/shared";

describe("calcularAjuste", () => {
  it("deve retornar zero quando valor = soma das atividades", () => {
    const result = calcularAjuste({
      valor: 1000,
      atividades: [
        { valor: 300 },
        { valor: 700 },
      ],
    });
    expect(result).toBe(0);
  });

  it("deve retornar positivo quando valor > soma (sobra)", () => {
    const result = calcularAjuste({
      valor: 1500,
      atividades: [
        { valor: 300 },
        { valor: 700 },
      ],
    });
    expect(result).toBe(500);
  });

  it("deve retornar negativo quando valor < soma (desconto)", () => {
    const result = calcularAjuste({
      valor: 800,
      atividades: [
        { valor: 300 },
        { valor: 700 },
      ],
    });
    expect(result).toBe(-200);
  });

  it("deve retornar o próprio valor quando sem atividades", () => {
    const result = calcularAjuste({
      valor: 1000,
      atividades: [],
    });
    expect(result).toBe(1000);
  });
});

describe("formatarAjuste", () => {
  it("deve formatar positivo com +", () => {
    expect(formatarAjuste(500)).toBe("+R$\u00a0500,00");
  });

  it("deve formatar negativo com − (sinal Unicode)", () => {
    expect(formatarAjuste(-250)).toBe("−R$\u00a0250,00");
  });

  it("deve formatar zero", () => {
    expect(formatarAjuste(0)).toBe("R$ 0,00");
  });
});

describe("statusEfetivo", () => {
  it("deve retornar RECEBIDA quando tem recebimentos vinculados", () => {
    const result = statusEfetivo({
      status: "REALIZADA",
      recebimentos: [{ id: "r1" }],
    });
    expect(result).toBe("RECEBIDA");
  });

  it("deve retornar status original quando sem recebimentos", () => {
    const result = statusEfetivo({
      status: "REALIZADA",
      recebimentos: [],
    });
    expect(result).toBe("REALIZADA");
  });

  it("deve retornar status original quando recebimentos undefined", () => {
    const result = statusEfetivo({
      status: "AGENDADA",
    });
    expect(result).toBe("AGENDADA");
  });
});

describe("estaVinculada", () => {
  it("deve retornar true quando vinculada", () => {
    expect(estaVinculada({ recebimentos: [{ id: "r1" }] })).toBe(true);
  });

  it("deve retornar false quando array vazio", () => {
    expect(estaVinculada({ recebimentos: [] })).toBe(false);
  });

  it("deve retornar false quando undefined", () => {
    expect(estaVinculada({})).toBe(false);
  });
});

describe("CriarRecebimentoSchema", () => {
  it("deve aceitar dados válidos", () => {
    const result = CriarRecebimentoSchema.safeParse({
      fonteDeRendaId: "abc123",
      valor: 1500,
      data: "2026-08-20",
      observacao: "Referente a julho",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar sem observacao", () => {
    const result = CriarRecebimentoSchema.safeParse({
      fonteDeRendaId: "abc123",
      valor: 1500,
      data: "2026-08-20",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar valor zero", () => {
    const result = CriarRecebimentoSchema.safeParse({
      fonteDeRendaId: "abc123",
      valor: 0,
      data: "2026-08-20",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar valor negativo", () => {
    const result = CriarRecebimentoSchema.safeParse({
      fonteDeRendaId: "abc123",
      valor: -100,
      data: "2026-08-20",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar data em formato inválido", () => {
    const result = CriarRecebimentoSchema.safeParse({
      fonteDeRendaId: "abc123",
      valor: 1500,
      data: "20/08/2026",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar observacao com mais de 300 caracteres", () => {
    const result = CriarRecebimentoSchema.safeParse({
      fonteDeRendaId: "abc123",
      valor: 1500,
      data: "2026-08-20",
      observacao: "x".repeat(301),
    });
    expect(result.success).toBe(false);
  });
});