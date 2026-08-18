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
 * Retorna atividades REALIZADA de uma dada fonte que NÃO estão vinculadas a nenhum recebimento.
 */
export async function contasAReceberDaFonte(
  prisma: any,
  fonteDeRendaId: string,
  userId: string
): Promise<any[]> {
  return prisma.atividade.findMany({
    where: {
      userId,
      fonteDeRendaId,
      status: "REALIZADA",
      recebimentos: { none: {} },
    },
    orderBy: { data: "asc" },
  });
}