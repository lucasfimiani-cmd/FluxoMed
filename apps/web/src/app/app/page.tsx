import AppShell from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { garantirAtividadesRecorrentes } from "@/lib/atividades/recorrencia";
import {
  realizado,
  projetado,
  contasAReceberPorFonte,
  liquidoEstimado,
} from "@/lib/dashboard/dashboard";
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
  searchParams: Promise<{ mes?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const mes = params.mes ?? mesAtual();
  const [anoStr, mesStr] = mes.split("-");
  const ano = parseInt(anoStr, 10);
  const mesNum = parseInt(mesStr, 10);

  // Garantir atividades recorrentes para o mês exibido
  await garantirAtividadesRecorrentes(user.id, ano, mesNum);

  const [valorRealizado, valorProjetado, valorLiquido, fontesAReceber] =
    await Promise.all([
      realizado(mes, user.id),
      projetado(mes, user.id),
      liquidoEstimado(mes, user.id),
      contasAReceberPorFonte(user.id),
    ]);

  const totalContasAReceber = fontesAReceber.reduce(
    (acc, f) => acc + f.total,
    0
  );

  const hojeDate = hoje();

  return (
    <AppShell>
      {/* Navegação de meses */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/app?mes=${mesAnterior(mes)}`}
          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200"
        >
          ‹
        </Link>
        <h1 className="text-xl font-bold">{nomeMes(mes)}</h1>
        <Link
          href={`/app?mes=${mesSeguinte(mes)}`}
          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200"
        >
          ›
        </Link>
      </div>

      {/* Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Recebido no mês</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatarMoeda(valorRealizado)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Projetado no mês</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {formatarMoeda(valorProjetado)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Líquido estimado</p>
          <p className="mt-1 text-2xl font-bold text-violet-600">
            {formatarMoeda(valorLiquido)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Projeção simples, sem cálculo fiscal (ADR-0006)
          </p>
        </div>
      </div>

      {/* Contas a Receber */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Contas a Receber</h2>
          <span className="text-lg font-bold text-emerald-600">
            {formatarMoeda(totalContasAReceber)}
          </span>
        </div>

        {fontesAReceber.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Nenhuma conta a receber no momento.
          </p>
        ) : (
          <div className="space-y-4">
            {fontesAReceber.map((fonte) => {
              const dataLimite = new Date(
                hojeDate.getTime() +
                  fonte.prazoPagamentoDias * 24 * 60 * 60 * 1000
              );
              const atrasada =
                fonte.atividades.some(
                  (a) =>
                    new Date(a.data.getTime() +
                      fonte.prazoPagamentoDias * 24 * 60 * 60 * 1000) < hojeDate
                );

              return (
                <div
                  key={fonte.fonteId}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fonte.fonteNome}</span>
                      {atrasada && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Atrasada
                        </span>
                      )}
                    </div>
                    <span className="font-semibold">
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