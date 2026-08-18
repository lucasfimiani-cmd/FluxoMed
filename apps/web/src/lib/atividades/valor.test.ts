import { describe, it, expect } from "vitest";
import { calcularValorAtividade, podeEditar } from "./valor";

describe("calcularValorAtividade", () => {
  it("deve retornar valorMensal para modelo FIXO_MENSAL", () => {
    const valor = calcularValorAtividade(
      {
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
        valorPorAtividade: null,
        precos: [],
      },
      "PLANTAO"
    );
    expect(valor).toBe(5000);
  });

  it("deve lançar erro se FIXO_MENSAL sem valorMensal", () => {
    expect(() =>
      calcularValorAtividade(
        {
          modelo: "FIXO_MENSAL",
          valorMensal: null,
          valorPorAtividade: null,
          precos: [],
        },
        "PLANTAO"
      )
    ).toThrow("Fonte de renda Fixo Mensal sem valor mensal configurado");
  });

  it("deve retornar valorPorAtividade para modelo POR_ATIVIDADE", () => {
    const valor = calcularValorAtividade(
      {
        modelo: "POR_ATIVIDADE",
        valorMensal: null,
        valorPorAtividade: 1200,
        precos: [],
      },
      "CONSULTA"
    );
    expect(valor).toBe(1200);
  });

  it("deve lançar erro se POR_ATIVIDADE sem valorPorAtividade", () => {
    expect(() =>
      calcularValorAtividade(
        {
          modelo: "POR_ATIVIDADE",
          valorMensal: null,
          valorPorAtividade: null,
          precos: [],
        },
        "CONSULTA"
      )
    ).toThrow(
      "Fonte de renda Por Atividade sem valor por atividade configurado"
    );
  });

  it("deve retornar preço do tipo para modelo POR_UNIDADE", () => {
    const valor = calcularValorAtividade(
      {
        modelo: "POR_UNIDADE",
        valorMensal: null,
        valorPorAtividade: null,
        precos: [
          { tipo: "PLANTAO", valor: 1500 },
          { tipo: "CONSULTA", valor: 300 },
        ],
      },
      "PLANTAO"
    );
    expect(valor).toBe(1500);
  });

  it("deve retornar preço de CONSULTA para POR_UNIDADE", () => {
    const valor = calcularValorAtividade(
      {
        modelo: "POR_UNIDADE",
        valorMensal: null,
        valorPorAtividade: null,
        precos: [
          { tipo: "PLANTAO", valor: 1500 },
          { tipo: "CONSULTA", valor: 300 },
        ],
      },
      "CONSULTA"
    );
    expect(valor).toBe(300);
  });

  it("deve lançar erro se POR_UNIDADE sem preço para o tipo", () => {
    expect(() =>
      calcularValorAtividade(
        {
          modelo: "POR_UNIDADE",
          valorMensal: null,
          valorPorAtividade: null,
          precos: [{ tipo: "PLANTAO", valor: 1500 }],
        },
        "PROCEDIMENTO"
      )
    ).toThrow("Configure o preço para Procedimento nesta fonte antes de registrar");
  });

  it("deve lançar erro para modelo desconhecido", () => {
    expect(() =>
      calcularValorAtividade(
        {
          modelo: "INVALIDO",
          valorMensal: null,
          valorPorAtividade: null,
          precos: [],
        },
        "PLANTAO"
      )
    ).toThrow("Modelo de remuneração desconhecido: INVALIDO");
  });
});

describe("podeEditar", () => {
  it("deve permitir edição de AGENDADA", () => {
    const result = podeEditar({ status: "AGENDADA" });
    expect(result.permitido).toBe(true);
  });

  it("deve permitir edição de REALIZADA", () => {
    const result = podeEditar({ status: "REALIZADA" });
    expect(result.permitido).toBe(true);
  });

  it("deve bloquear edição de CANCELADA", () => {
    const result = podeEditar({ status: "CANCELADA" });
    expect(result.permitido).toBe(false);
    expect(result.mensagem).toBe("Atividade cancelada não pode ser editada");
  });
});

import { CriarAtividadeSchema, EditarAtividadeSchema } from "@fluxomed/shared";

describe("CriarAtividadeSchema", () => {
  it("deve aceitar dados válidos", () => {
    const result = CriarAtividadeSchema.safeParse({
      tipo: "PLANTAO",
      fonteDeRendaId: "abc123",
      data: "2026-08-20",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar data em formato inválido", () => {
    const result = CriarAtividadeSchema.safeParse({
      tipo: "PLANTAO",
      fonteDeRendaId: "abc123",
      data: "20/08/2026",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar data vazia", () => {
    const result = CriarAtividadeSchema.safeParse({
      tipo: "PLANTAO",
      fonteDeRendaId: "abc123",
      data: "",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar tipo inválido", () => {
    const result = CriarAtividadeSchema.safeParse({
      tipo: "INVALIDO",
      fonteDeRendaId: "abc123",
      data: "2026-08-20",
    });
    expect(result.success).toBe(false);
  });
});

describe("EditarAtividadeSchema", () => {
  it("deve aceitar dados válidos", () => {
    const result = EditarAtividadeSchema.safeParse({
      tipo: "CONSULTA",
      fonteDeRendaId: "def456",
      data: "2026-08-21",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar data em formato inválido", () => {
    const result = EditarAtividadeSchema.safeParse({
      tipo: "CONSULTA",
      fonteDeRendaId: "def456",
      data: "21-08-2026",
    });
    expect(result.success).toBe(false);
  });
});