/**
 * Retorna o status efetivo de uma atividade considerando vínculos com recebimentos.
 * Se houver ≥1 recebimento vinculado, exibe "RECEBIDA" (derivado).
 * Caso contrário, retorna o status armazenado.
 */
export function statusEfetivo(atividade: {
  status: string;
  recebimentos?: { id: string }[];
}): string {
  if (atividade.recebimentos && atividade.recebimentos.length > 0) {
    return "RECEBIDA";
  }
  return atividade.status;
}

/**
 * Verifica se uma atividade está vinculada a algum recebimento.
 */
export function estaVinculada(atividade: {
  recebimentos?: { id: string }[];
}): boolean {
  return !!(atividade.recebimentos && atividade.recebimentos.length > 0);
}