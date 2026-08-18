import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { calcularAjuste, formatarAjuste } from "@/lib/recebimentos/ajuste";
import { contasAReceberDaFonte } from "@/lib/recebimentos/ajuste";
import { vincularAtividade, desvincularAtividade } from "@/lib/recebimentos/actions";
import { rotuloTipoAtividade } from "@/lib/atividades/valor";

function formatarValor(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

export default async function DetalheRecebimentoPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const recebimento = await prisma.recebimento.findUnique({
    where: { id },
    include: {
      fonteDeRenda: { select: { id: true, nome: true } },
      atividades: {
        select: { id: true, valor: true, tipo: true, data: true },
        orderBy: { data: "asc" },
      },
    },
  });

  if (!recebimento || recebimento.userId !== user.id) notFound();

  const ajuste = calcularAjuste({
    valor: recebimento.valor,
    atividades: recebimento.atividades,
  });

  const contasAReceber = await contasAReceberDaFonte(
    prisma,
    recebimento.fonteDeRendaId,
    user.id
  );

  return (
    <AppShell currentPath="/app/recebimentos">
      <div className="mb-4">
        <Link
          href="/app/recebimentos"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
        >
          &larr; Voltar para Recebimentos
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">
        {formatarValor(recebimento.valor)} — {recebimento.fonteDeRenda.nome}
      </h1>

      {sp?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      {/* Dados do recebimento */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Fonte</p>
            <p className="mt-1 font-medium text-zinc-800">{recebimento.fonteDeRenda.nome}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Data</p>
            <p className="mt-1 font-medium text-zinc-800">{formatarData(recebimento.data)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Valor</p>
            <p className="mt-1 text-lg font-bold text-zinc-900">
              {formatarValor(recebimento.valor)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Ajuste</p>
            <p
              className={`mt-1 text-lg font-bold ${
                ajuste < 0
                  ? "text-red-600"
                  : ajuste > 0
                  ? "text-emerald-600"
                  : "text-zinc-400"
              }`}
            >
              {formatarAjuste(ajuste)}
            </p>
          </div>
        </div>
        {recebimento.observacao && (
          <div className="mt-4 border-t border-zinc-100 pt-3">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Observação</p>
            <p className="mt-1 text-sm text-zinc-600">{recebimento.observacao}</p>
          </div>
        )}
      </div>

      {/* Atividades vinculadas */}
      <h2 className="mb-3 text-base font-semibold text-zinc-800">
        Atividades Vinculadas ({recebimento.atividades.length})
      </h2>

      {recebimento.atividades.length === 0 ? (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-400 shadow-sm">
          Nenhuma atividade vinculada a este recebimento.
        </div>
      ) : (
        <div className="mb-6 space-y-2">
          {recebimento.atividades.map((atv) => (
            <div
              key={atv.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  {rotuloTipoAtividade[atv.tipo] ?? atv.tipo}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatarValor(atv.valor)} &middot;{" "}
                  {formatarData(atv.data)}
                </p>
              </div>
              <form action={desvincularAtividade}>
                <input type="hidden" name="recebimentoId" value={id} />
                <input type="hidden" name="atividadeId" value={atv.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-100"
                >
                  Desvincular
                </button>
              </form>
            </div>
          ))}
          <div className="mt-3 text-right text-sm text-zinc-500">
            Soma:{" "}
            <span className="font-semibold text-zinc-800">
              {formatarValor(recebimento.atividades.reduce((acc, a) => acc + a.valor, 0))}
            </span>
          </div>
        </div>
      )}

      {/* Contas a receber desta fonte */}
      <h2 className="mb-3 text-base font-semibold text-zinc-800">
        Contas a Receber desta Fonte ({contasAReceber.length})
      </h2>

      {contasAReceber.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-400 shadow-sm">
          Nenhuma atividade realizada pendente de recebimento nesta fonte.
        </div>
      ) : (
        <div className="space-y-2">
          {contasAReceber.map((atv) => (
            <div
              key={atv.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  {rotuloTipoAtividade[atv.tipo] ?? atv.tipo}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatarValor(atv.valor)} &middot;{" "}
                  {formatarData(atv.data)}
                </p>
              </div>
              <form action={vincularAtividade}>
                <input type="hidden" name="recebimentoId" value={id} />
                <input type="hidden" name="atividadeId" value={atv.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-600 transition-colors hover:bg-emerald-100"
                >
                  Vincular
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}