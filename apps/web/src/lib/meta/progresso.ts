/**
 * Funções puras para cálculo de progresso da meta financeira mensal.
 * Testáveis — sem dependências externas.
 */

export type FaixaCor = "vermelho" | "amarelo" | "verde";

/**
 * Calcula o percentual de progresso em relação ao valor alvo.
 * Retorna valor entre 0 e Infinity (pode ultrapassar 100%).
 */
export function percentualProgresso(valorAtual: number, valorAlvo: number): number {
  if (valorAlvo <= 0) return 0;
  return Math.round((valorAtual / valorAlvo) * 100);
}

/**
 * Retorna a faixa de cor com base no percentual.
 */
export function faixaCor(percentual: number): FaixaCor {
  if (percentual >= 100) return "verde";
  if (percentual >= 50) return "amarelo";
  return "vermelho";
}

/**
 * Retorna a classe CSS Tailwind v4 para a barra de progresso com base na faixa.
 */
export function classeBarraProgresso(cor: FaixaCor): string {
  switch (cor) {
    case "verde":
      return "bg-emerald-500";
    case "amarelo":
      return "bg-amber-400";
    case "vermelho":
      return "bg-red-500";
  }
}

/**
 * Retorna o texto de "faltam" ou "meta atingida".
 */
export function textoFaltam(valorAtual: number, valorAlvo: number): string {
  if (valorAtual >= valorAlvo) return "Meta atingida";
  const falta = valorAlvo - valorAtual;
  return `Faltam ${formatarMoeda(falta)}`;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}