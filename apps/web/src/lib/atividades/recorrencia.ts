import { prisma as defaultPrisma } from "@/lib/prisma";
import { calcularValorAtividade } from "./valor";

/**
 * Gera atividades recorrentes (FIXO_MENSAL) para um dado (ano, mês) de forma
 * idempotente. Chamado server-side na página de listagem para o mês exibido.
 *
 * Regras:
 * - Apenas fontes FIXO_MENSAL ativas
 * - Apenas se ainda não existe geração para (fonteDeRendaId, ano, mes)
 * - Atividade gerada: tipo OUTRO, status REALIZADA, data = 1º do mês (meio-dia)
 * - Valor calculado via calcularValorAtividade (consistência)
 * - Inserção em transação; violação do unique é ignorada (idempotente)
 *
 * @param prisma - Instância opcional (para testes com banco temporário)
 */
export async function garantirAtividadesRecorrentes(
  userId: string,
  ano: number,
  mes: number,
  prisma: typeof defaultPrisma = defaultPrisma
): Promise<void> {
  const fontesFixas = await prisma.fonteDeRenda.findMany({
    where: {
      userId,
      modelo: "FIXO_MENSAL",
      ativa: true,
    },
    include: { precos: true },
  });

  for (const fonte of fontesFixas) {
    const dataAtividade = new Date(ano, mes - 1, 1, 12, 0, 0);

    let valor: number;
    try {
      valor = calcularValorAtividade(
        {
          modelo: fonte.modelo,
          valorMensal: fonte.valorMensal,
          valorPorAtividade: fonte.valorPorAtividade,
          precos: fonte.precos.map((p) => ({ tipo: p.tipo, valor: p.valor })),
        },
        "OUTRO"
      );
    } catch {
      // Se não for possível calcular (ex.: fonte sem valor configurado), pula
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Verificar se já existe geração para este mês (proteção extra contra race)
        const existente = await tx.recorrenciaGerada.findUnique({
          where: {
            fonteDeRendaId_ano_mes: {
              fonteDeRendaId: fonte.id,
              ano,
              mes,
            },
          },
        });
        if (existente) return; // Idempotente: já gerado

        const atividade = await tx.atividade.create({
          data: {
            userId,
            fonteDeRendaId: fonte.id,
            tipo: "OUTRO",
            data: dataAtividade,
            status: "REALIZADA",
            valor,
          },
        });

        await tx.recorrenciaGerada.create({
          data: {
            fonteDeRendaId: fonte.id,
            atividadeId: atividade.id,
            ano,
            mes,
          },
        });
      });
    } catch (err: any) {
      // Se violação de unique (concorrência), ignora silenciosamente
      if (
        err?.code === "P2002" ||
        (err?.message && err.message.includes("Unique constraint"))
      ) {
        continue;
      }
      throw err;
    }
  }
}