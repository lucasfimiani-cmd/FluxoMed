const rotuloTipoAtividade: Record<string, string> = {
  PLANTAO: "Plantão",
  CONSULTA: "Consulta",
  PROCEDIMENTO: "Procedimento",
  OUTRO: "Outro",
};

/**
 * Calcula o valor de uma atividade com base no modelo de remuneração da fonte.
 * O valor é sempre derivado — não há edição manual.
 *
 * @throws Error com mensagem pt-BR se o cálculo não for possível.
 */
export function calcularValorAtividade(
  fonte: {
    modelo: string;
    valorMensal: number | null;
    valorPorAtividade: number | null;
    precos: { tipo: string; valor: number }[];
  },
  tipoAtividade: string
): number {
  if (fonte.modelo === "FIXO_MENSAL") {
    if (!fonte.valorMensal || fonte.valorMensal <= 0) {
      throw new Error(
        "Fonte de renda Fixo Mensal sem valor mensal configurado"
      );
    }
    return fonte.valorMensal;
  }

  if (fonte.modelo === "POR_ATIVIDADE") {
    if (!fonte.valorPorAtividade || fonte.valorPorAtividade <= 0) {
      throw new Error(
        "Fonte de renda Por Atividade sem valor por atividade configurado"
      );
    }
    return fonte.valorPorAtividade;
  }

  if (fonte.modelo === "POR_UNIDADE") {
    const preco = fonte.precos.find((p) => p.tipo === tipoAtividade);
    if (!preco || preco.valor <= 0) {
      const rotulo =
        rotuloTipoAtividade[tipoAtividade] ?? tipoAtividade;
      throw new Error(
        `Configure o preço para ${rotulo} nesta fonte antes de registrar`
      );
    }
    return preco.valor;
  }

  throw new Error(`Modelo de remuneração desconhecido: ${fonte.modelo}`);
}

export type FonteComPrecos = Parameters<typeof calcularValorAtividade>[0];

/**
 * Verifica se uma atividade pode ser editada.
 * Bloqueia edição de atividades CANCELADAS ou vinculadas a um Recebimento.
 */
export function podeEditar(atividade: {
  status: string;
  recebimentos?: { id: string }[];
}): {
  permitido: boolean;
  mensagem?: string;
} {
  if (atividade.status === "CANCELADA") {
    return {
      permitido: false,
      mensagem: "Atividade cancelada não pode ser editada",
    };
  }

  if (atividade.recebimentos && atividade.recebimentos.length > 0) {
    return {
      permitido: false,
      mensagem:
        "Atividade vinculada a um recebimento — desvincule antes de editar",
    };
  }

  return { permitido: true };
}

export { rotuloTipoAtividade };