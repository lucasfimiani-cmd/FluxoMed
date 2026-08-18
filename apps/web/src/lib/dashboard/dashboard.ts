import { prisma } from "@/lib/prisma";
import { contasAReceberDaFonte } from "@/lib/recebimentos/ajuste";

/**
 * Retorna o primeiro e último dia do mês no formato YYYY-MM.
 */
function limitesDoMes(mes: string): { inicio: Date; fim: Date } {
  const [ano, m] = mes.split("-").map(Number);
  const inicio = new Date(ano, m - 1, 1, 0, 0, 0);
  const fim = new Date(ano, m, 0, 23, 59, 59, 999);
  return { inicio, fim };
}

/**
 * Soma dos recebimentos do usuário no mês.
 */
export async function realizado(mes: string, userId: string): Promise<number> {
  const { inicio, fim } = limitesDoMes(mes);

  const result = await prisma.recebimento.aggregate({
    where: {
      userId,
      data: { gte: inicio, lte: fim },
    },
    _sum: { valor: true },
  });

  return result._sum.valor ?? 0;
}

/**
 * Soma das atividades REALIZADA (qualquer vínculo) no mês.
 * Usada pela meta mensal — dimensão "produção do mês".
 */
export async function producaoDoMes(mes: string, userId: string): Promise<number> {
  const { inicio, fim } = limitesDoMes(mes);

  const result = await prisma.atividade.aggregate({
    where: {
      userId,
      status: "REALIZADA",
      data: { gte: inicio, lte: fim },
    },
    _sum: { valor: true },
  });

  return result._sum.valor ?? 0;
}

/**
 * Soma das atividades AGENDADA/REALIZADA sem vínculo com recebimento
 * cuja data + prazoPagamentoDias da fonte cai no mês alvo.
 */
export async function projetado(mes: string, userId: string): Promise<number> {
  const { inicio, fim } = limitesDoMes(mes);

  const atividades = await prisma.atividade.findMany({
    where: {
      userId,
      status: { in: ["AGENDADA", "REALIZADA"] },
      recebimentos: { none: {} },
    },
    include: {
      fonteDeRenda: { select: { prazoPagamentoDias: true } },
    },
  });

  let total = 0;
  for (const atv of atividades) {
    const dataAtv = new Date(atv.data);
    const dataPrevista = new Date(
      dataAtv.getTime() + atv.fonteDeRenda.prazoPagamentoDias * 24 * 60 * 60 * 1000
    );
    if (dataPrevista >= inicio && dataPrevista <= fim) {
      total += atv.valor;
    }
  }

  return total;
}

/**
 * Contas a receber agregadas por fonte.
 * Retorna { fonte, atividades, total, prazoPagamentoDias } para cada fonte
 * que possui atividades REALIZADA sem vínculo.
 */
export async function contasAReceberPorFonte(userId: string) {
  const fontes = await prisma.fonteDeRenda.findMany({
    where: { userId },
    select: { id: true, nome: true, prazoPagamentoDias: true },
  });

  const resultado: {
    fonteId: string;
    fonteNome: string;
    prazoPagamentoDias: number;
    atividades: { id: string; valor: number; data: Date }[];
    total: number;
  }[] = [];

  for (const fonte of fontes) {
    const atividades = await contasAReceberDaFonte(prisma, fonte.id, userId);
    if (atividades.length === 0) continue;

    const total = atividades.reduce(
      (acc, a) => acc + a.valor,
      0
    );

    resultado.push({
      fonteId: fonte.id,
      fonteNome: fonte.nome,
      prazoPagamentoDias: fonte.prazoPagamentoDias,
      atividades: atividades.map((a) => ({
        id: a.id,
        valor: a.valor,
        data: a.data,
      })),
      total,
    });
  }

  return resultado;
}

/**
 * Líquido estimado: Σ recebimentos.valor × (1 − aliquotaEfetiva/100).
 * Projeção simples, sem cálculo fiscal (ADR-0006).
 */
export async function liquidoEstimado(
  mes: string,
  userId: string
): Promise<number> {
  const { inicio, fim } = limitesDoMes(mes);

  const recebimentos = await prisma.recebimento.findMany({
    where: {
      userId,
      data: { gte: inicio, lte: fim },
    },
    include: {
      fonteDeRenda: {
        include: {
          perfilFiscal: { select: { aliquotaEfetiva: true } },
        },
      },
    },
  });

  let total = 0;
  for (const rec of recebimentos) {
    const aliquota = rec.fonteDeRenda.perfilFiscal.aliquotaEfetiva;
    total += rec.valor * (1 - aliquota / 100);
  }

  return total;
}