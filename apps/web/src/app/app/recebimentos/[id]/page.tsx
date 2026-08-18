import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { calcularAjuste, formatarAjuste } from "@/lib/recebimentos/ajuste";
import { contasAReceberDaFonte } from "@/lib/recebimentos/ajuste";
import { vincularAtividade, desvincularAtividade } from "@/lib/recebimentos/actions";

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

  // Contas a receber desta fonte (atividades REALIZADA sem vínculo)
  const contasAReceber = await contasAReceberDaFonte(
    prisma,
    recebimento.fonteDeRendaId,
    user.id
  );

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          href="/app/recebimentos"
          className="text-sm text-emerald-600 hover:underline"
        >
          &larr; Voltar para Recebimentos
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold">
        {formatarValor(recebimento.valor)} — {recebimento.fonteDeRenda.nome}
      </h1>

      {sp?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      {/* Dados do recebimento */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-zinc-500">Fonte de Renda</p>
            <p className="font-medium">{recebimento.fonteDeRenda.nome}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Data</p>
            <p className="font-medium">{formatarData(recebimento.data)}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Valor Recebido</p>
            <p className="text-lg font-bold">
              {formatarValor(recebimento.valor)}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Ajuste</p>
            <p
              className={`text-lg font-bold ${
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
          <p className="mt-3 text-sm text-zinc-600">
            {recebimento.observacao}
          </p>
        )}
      </div>

      {/* Atividades vinculadas */}
      <h2 className="mb-3 text-lg font-semibold">
        Atividades Vinculadas ({recebimento.atividades.length})
      </h2>

      {recebimento.atividades.length === 0 ? (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-400">
          Nenhuma atividade vinculada a este recebimento.
        </div>
      ) : (
        <div className="mb-6 space-y-2">
          {recebimento.atividades.map((atv) => (
            <div
              key={atv.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium">{atv.tipo}</p>
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
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
                >
                  Desvincular
                </button>
              </form>
            </div>
          ))}
          <div className="mt-2 text-right text-sm text-zinc-500">
            Soma: {formatarValor(recebimento.atividades.reduce((acc, a) => acc + a.valor, 0))}
          </div>
        </div>
      )}

      {/* Contas a receber desta fonte */}
      <h2 className="mb-3 text-lg font-semibold">
        Contas a Receber desta Fonte ({contasAReceber.length})
      </h2>

      {contasAReceber.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-400">
          Nenhuma atividade realizada pendente de recebimento nesta fonte.
        </div>
      ) : (
        <div className="space-y-2">
          {contasAReceber.map((atv: { id: string; tipo: string; valor: number; data: Date }) => (
            <div
              key={atv.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium">{atv.tipo}</p>
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
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-100"
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