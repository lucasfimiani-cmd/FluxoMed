import { describe, it, expect } from "vitest";
import {
  CriarFonteDeRendaSchema,
  ModeloRemuneracao,
} from "@fluxomed/shared";

describe("CriarFonteDeRendaSchema", () => {
  const baseValid = {
    nome: "Hospital São Lucas",
    perfilFiscalId: "some-cuid",
    prazoPagamentoDias: 30,
  };

  describe("FIXO_MENSAL", () => {
    it("should accept valid FIXO_MENSAL with valorMensal", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
      });
      expect(result.success).toBe(true);
    });

    it("should reject FIXO_MENSAL without valorMensal", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "FIXO_MENSAL",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.errors.some((e) => e.path.includes("valorMensal"))
        ).toBe(true);
      }
    });

    it("should reject FIXO_MENSAL with valorMensal zero", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "FIXO_MENSAL",
        valorMensal: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject FIXO_MENSAL with valorPorAtividade", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
        valorPorAtividade: 100,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.errors.some((e) => e.path.includes("valorPorAtividade"))
        ).toBe(true);
      }
    });

    it("should reject FIXO_MENSAL with precos table", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
        precos: [{ tipo: "PLANTAO", valor: 500 }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.errors.some((e) => e.path.includes("precos"))
        ).toBe(true);
      }
    });
  });

  describe("POR_ATIVIDADE", () => {
    it("should accept valid POR_ATIVIDADE with valorPorAtividade", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_ATIVIDADE",
        valorPorAtividade: 350,
      });
      expect(result.success).toBe(true);
    });

    it("should reject POR_ATIVIDADE without valorPorAtividade", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_ATIVIDADE",
      });
      expect(result.success).toBe(false);
    });

    it("should reject POR_ATIVIDADE with valorPorAtividade zero", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_ATIVIDADE",
        valorPorAtividade: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject POR_ATIVIDADE with valorMensal", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_ATIVIDADE",
        valorPorAtividade: 350,
        valorMensal: 5000,
      });
      expect(result.success).toBe(false);
    });

    it("should reject POR_ATIVIDADE with precos", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_ATIVIDADE",
        valorPorAtividade: 350,
        precos: [{ tipo: "PLANTAO", valor: 500 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("POR_UNIDADE", () => {
    it("should accept valid POR_UNIDADE with precos", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_UNIDADE",
        precos: [
          { tipo: "PLANTAO", valor: 1000 },
          { tipo: "CONSULTA", valor: 200 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject POR_UNIDADE without precos", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_UNIDADE",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.errors.some((e) => e.path.includes("precos"))
        ).toBe(true);
      }
    });

    it("should reject POR_UNIDADE with empty precos array", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_UNIDADE",
        precos: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject POR_UNIDADE with valorMensal", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_UNIDADE",
        valorMensal: 5000,
        precos: [{ tipo: "PLANTAO", valor: 1000 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject POR_UNIDADE with valorPorAtividade", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_UNIDADE",
        valorPorAtividade: 350,
        precos: [{ tipo: "PLANTAO", valor: 1000 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject POR_UNIDADE with preco valor zero", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_UNIDADE",
        precos: [{ tipo: "PLANTAO", valor: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject POR_UNIDADE with duplicate tipo", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "POR_UNIDADE",
        precos: [
          { tipo: "PLANTAO", valor: 1000 },
          { tipo: "PLANTAO", valor: 2000 },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.errors.some((e) => e.path.includes("tipo") && e.path.includes("precos"))
        ).toBe(true);
      }
    });
  });

  describe("prazoPagamentoDias", () => {
    it("should reject negative prazo", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
        prazoPagamentoDias: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject prazo above 365", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
        prazoPagamentoDias: 366,
      });
      expect(result.success).toBe(false);
    });

    it("should accept prazo at boundaries (0 and 365)", () => {
      const r1 = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
        prazoPagamentoDias: 0,
      });
      expect(r1.success).toBe(true);

      const r2 = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
        prazoPagamentoDias: 365,
      });
      expect(r2.success).toBe(true);
    });
  });

  describe("nome validation", () => {
    it("should reject empty nome", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        nome: "",
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
      });
      expect(result.success).toBe(false);
    });

    it("should reject nome exceeding 100 chars", () => {
      const result = CriarFonteDeRendaSchema.safeParse({
        ...baseValid,
        nome: "a".repeat(101),
        modelo: "FIXO_MENSAL",
        valorMensal: 5000,
      });
      expect(result.success).toBe(false);
    });
  });
});