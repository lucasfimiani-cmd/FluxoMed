import AppShell from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { garantirAtividadesRecorrentes } from "@/lib/atividades/recorrencia";
import {
  realizado,
  producaoDoMes,
  projetado,
  contasAReceberPorFonte,
  liquidoEstimado,
} from "@/lib/dashboard/dashboard";
import { criarMeta, editarMeta } from "@/lib/meta/actions";
import { percentualProgresso, faixaCor, classeBarraProgresso, textoFaltam } from "@/lib/meta/progresso";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function mesAtual(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

function mesAnterior(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(ano, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mesSeguinte(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(ano, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const nomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${nomes[m - 1]} ${ano}`;
}

function hoje(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; error?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const mes = params.mes ?? mesAtual();
  const [anoStr, mesStr] = mes.split("-");
  const ano = parseInt(anoStr, 10);
  const mesNum = parseInt(mesStr, 10);
  const error = params.error;

  // Garantir atividades recorrentes para o mês exibido
  await garantirAtividadesRecorrentes(user.id, ano, mesNum);

  const [valorRealizado, valorProjetado, valorLiquido, fontesAReceber, valorProducao, meta] =
    await Promise.all([
      realizado(mes, user.id),
      projetado(mes, user.id),
      liquidoEstimado(mes, user.id),
      contasAReceberPorFonte(user.id),
      producaoDoMes(mes, user.id),
      prisma.metaFinanceira.findUnique({
        where: {
          userId_ano_mes: { userId: user.id, ano, mes: mesNum },
        },
      }),
    ]);

  const totalContasAReceber = fontesAReceber.reduce(
    (acc, f) => acc + f.total,
    0
  );

  const hojeDate = hoje();

  const pctProducao = meta ? percentualProgresso(valorProducao, meta.valorAlvo) : 0;
  const pctCaixa = meta ? percentualProgresso(valorRealizado, meta.valorAlvo) : 0;
  const corProducao = meta ? faixaCor(pctProducao) : "vermelho";
  const corCaixa = meta ? faixaCor(pctCaixa) : "vermelho";

  const corBarra = (cor: string) => {
    switch (cor) {
      case "verde": return "bg-emerald-500";
      case "amarelo": return "bg-amber-400";
      default: return "bg-red-500";
    }
  };

  const corTexto = (cor: string) => {
    switch (cor) {
      case "verde": return "text-emerald-600";
      case "amarelo": return "text-amber-600";
      default: return "text-red-600";
    }
  };

  return (
    <AppShell currentPath="/app">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Resumo financeiro do mês</p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Recebido no mês
          </p>
          <p className="mt-2 text-2xl font-bold text-brand-600">
            {formatarMoeda(valorRealizado)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Projetado no mês
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {formatarMoeda(valorProjetado)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Líquido estimado
          </p>
          <p className="mt-2 text-2xl font-bold text-violet-600">
            {formatarMoeda(valorLiquido)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Projeção simples, sem cálculo fiscal
          </p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-3 shadow-sm">
        <Link
          href={`/app?mes=${mesAnterior(mes)}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
          aria-label="Mês anterior"
        >
          ‹
        </Link>
        <span className="text-base font-semibold text-zinc-800">{nomeMes(mes)}</span>
        <Link
          href={`/app?mes=${mesSeguinte(mes)}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
          aria-label="Mês seguinte"
        >
          ›
        </Link>
      </div>

      {/* Meta do Mês */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-zinc-800">Meta do Mês</h2>

        {!meta ? (
          <form action={criarMeta} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="ano" value={ano} />
            <input type="hidden" name="mes" value={mesNum} />
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Valor alvo
              </label>
              <input
                type="number"
                name="valorAlvo"
                step="0.01"
                min="0.01"
                required
                placeholder="Ex.: 10000.00"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Definir meta
            </button>
            {error && (
              <p className="w-full text-sm text-red-600">{error}</p>
            )}
          </form>
        ) : (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-zinc-500">
                Valor alvo:{" "}
                <span className="font-semibold text-zinc-800">
                  {formatarMoeda(meta.valorAlvo)}
                </span>
              </span>
              <form action={editarMeta} className="flex items-center gap-2">
                <input type="hidden" name="id" value={meta.id} />
                <input
                  type="number"
                  name="valorAlvo"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={meta.valorAlvo}
                  className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  Editar
                </button>
              </form>
            </div>

            {/* Produção do mês */}
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-600">Produção do mês</span>
                <span className="font-semibold text-zinc-800">{formatarMoeda(valorProducao)}</span>
              </div>
              <div className="overflow-hidden rounded-full bg-zinc-200">
                <div
                  className={`h-2.5 rounded-full transition-all ${corBarra(corProducao)}`}
                  style={{ width: `${Math.min(pctProducao, 100)}%` }}
                />
              </div>
              <p className={`mt-1 text-xs font-medium ${corTexto(corProducao)}`}>
                {pctProducao}% — {textoFaltam(valorProducao, meta.valorAlvo)}
              </p>
            </div>

            {/* Caixa recebido */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-600">Caixa recebido</span>
                <span className="font-semibold text-zinc-800">{formatarMoeda(valorRealizado)}</span>
              </div>
              <div className="overflow-hidden rounded-full bg-zinc-200">
                <div
                  className={`h-2.5 rounded-full transition-all ${corBarra(corCaixa)}`}
                  style={{ width: `${Math.min(pctCaixa, 100)}%` }}
                />
              </div>
              <p className={`mt-1 text-xs font-medium ${corTexto(corCaixa)}`}>
                {pctCaixa}% — {textoFaltam(valorRealizado, meta.valorAlvo)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Contas a Receber */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">Contas a Receber</h2>
          <span className="text-lg font-bold text-brand-600">
            {formatarMoeda(totalContasAReceber)}
          </span>
        </div>

        {fontesAReceber.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            Nenhuma conta a receber no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {fontesAReceber.map((fonte) => {
              const atrasada =
                fonte.atividades.some(
                  (a) =>
                    new Date(a.data.getTime() +
                      fonte.prazoPagamentoDias * 24 * 60 * 60 * 1000) < hojeDate
                );

              return (
                <div
                  key={fonte.fonteId}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-800">{fonte.fonteNome}</span>
                      {atrasada && (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          Atrasada
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-zinc-800">
                      {formatarMoeda(fonte.total)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Prazo: {fonte.prazoPagamentoDias} dias
                    {fonte.atividades.length > 0 &&
                      ` · ${fonte.atividades.length} atividade${fonte.atividades.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}