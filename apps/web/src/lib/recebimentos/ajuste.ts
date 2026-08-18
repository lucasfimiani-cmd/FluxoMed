/**
 * Calcula o ajuste de um recebimento: valor do recebimento − soma das atividades vinculadas.
 * Pode ser positivo (sobra), negativo (desconto) ou zero.
 */
export function calcularAjuste(recebimento: {
  valor: number;
  atividades?: { valor: number }[];
}): number {
  const somaAtividades =
    recebimento.atividades?.reduce((acc, a) => acc + a.valor, 0) ?? 0;
  return recebimento.valor - somaAtividades;
}

/**
 * Formata o ajuste para exibição com sinal.
 */
export function formatarAjuste(ajuste: number): string {
  const valorFormatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(ajuste));

  if (ajuste === 0) return `R$ 0,00`;
  if (ajuste > 0) return `+${valorFormatado}`;
  return `−${valorFormatado}`;
}

/**
 * Shape de uma atividade a receber retornada por contasAReceberDaFonte.
 */
export interface AtividadeAReceber {
  id: string;
  tipo: string;
  valor: number;
  data: Date;
}

/**
 * Retorna atividades REALIZADA de uma dada fonte que NÃO estão vinculadas a nenhum recebimento.
 * Aceita o PrismaClient real ou um mock com atividade.findMany.
 */
export async function contasAReceberDaFonte<T extends {
  atividade: { findMany: (...args: any[]) => Promise<any> };
}>(
  prisma: T,
  fonteDeRendaId: string,
  userId: string
): Promise<AtividadeAReceber[]> {
  return prisma.atividade.findMany({
    where: {
      userId,
      fonteDeRendaId,
      status: "REALIZADA",
      recebimentos: { none: {} },
    },
    orderBy: { data: "asc" },
  }) as Promise<AtividadeAReceber[]>;
}