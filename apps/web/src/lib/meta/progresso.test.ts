import { describe, it, expect } from "vitest";
import {
  percentualProgresso,
  faixaCor,
  classeBarraProgresso,
  textoFaltam,
} from "./progresso";

describe("percentualProgresso", () => {
  it("deve retornar 0 quando valor atual é 0", () => {
    expect(percentualProgresso(0, 5000)).toBe(0);
  });

  it("deve retornar 50% quando valor atual é metade do alvo", () => {
    expect(percentualProgresso(2500, 5000)).toBe(50);
  });

  it("deve retornar 100% quando valor atual igual ao alvo", () => {
    expect(percentualProgresso(5000, 5000)).toBe(100);
  });

  it("deve retornar >100% quando ultrapassou o alvo", () => {
    expect(percentualProgresso(6000, 5000)).toBe(120);
  });

  it("deve arredondar corretamente (99.5 → 100)", () => {
    expect(percentualProgresso(99.5, 100)).toBe(100);
  });

  it("deve arredondar corretamente (33.33 → 33)", () => {
    expect(percentualProgresso(33.33, 100)).toBe(33);
  });

  it("deve retornar 0 quando valorAlvo é 0 ou negativo", () => {
    expect(percentualProgresso(100, 0)).toBe(0);
    expect(percentualProgresso(100, -10)).toBe(0);
  });
});

describe("faixaCor", () => {
  it("deve retornar vermelho para percentual < 50", () => {
    expect(faixaCor(0)).toBe("vermelho");
    expect(faixaCor(49)).toBe("vermelho");
  });

  it("deve retornar amarelo para percentual entre 50 e 99", () => {
    expect(faixaCor(50)).toBe("amarelo");
    expect(faixaCor(75)).toBe("amarelo");
    expect(faixaCor(99)).toBe("amarelo");
  });

  it("deve retornar verde para percentual >= 100", () => {
    expect(faixaCor(100)).toBe("verde");
    expect(faixaCor(150)).toBe("verde");
  });
});

describe("classeBarraProgresso", () => {
  it("deve retornar classe verde", () => {
    expect(classeBarraProgresso("verde")).toBe("bg-emerald-500");
  });

  it("deve retornar classe amarelo", () => {
    expect(classeBarraProgresso("amarelo")).toBe("bg-amber-400");
  });

  it("deve retornar classe vermelho", () => {
    expect(classeBarraProgresso("vermelho")).toBe("bg-red-500");
  });
});

describe("textoFaltam", () => {
  it("deve mostrar 'Meta atingida' quando valor atual >= alvo", () => {
    expect(textoFaltam(5000, 5000)).toBe("Meta atingida");
    expect(textoFaltam(6000, 5000)).toBe("Meta atingida");
  });

  it("deve mostrar 'Faltam R$ X' quando valor atual < alvo", () => {
    const result = textoFaltam(3000, 5000);
    expect(result).toMatch(/^Faltam\s/);
    expect(result).toContain("R$");
    expect(result).toContain("2.000,00");
  });

  it("deve formatar centavos corretamente", () => {
    const result = textoFaltam(4999.99, 5000);
    expect(result).toMatch(/^Faltam\s/);
    expect(result).toContain("0,01");
  });
});