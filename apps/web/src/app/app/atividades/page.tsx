import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { realizarAtividade, cancelarAtividade } from "@/lib/atividades/actions";
import { rotuloTipoAtividade } from "@/lib/atividades/valor";
import { garantirAtividadesRecorrentes } from "@/lib/atividades/recorrencia";
import { statusEfetivo } from "@/lib/recebimentos/status";

const rotuloStatus: Record<string, { label: string; cor: string }> = {
  AGENDADA: { label: "Agendada", cor: "bg-amber-100 text-amber-700" },
  REALIZADA: { label: "Realizada", cor: "bg-emerald-100 text-emerald-700" },
  CANCELADA: { label: "Cancelada", cor: "bg-red-100 text-red-700" },
  RECEBIDA: { label: "Recebida", cor: "bg-blue-100 text-blue-700" },
};

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

function getMesAno(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${data.getFullYear()}-${mes}`;
}

export default async function AtividadesPage(props: {
  searchParams?: Promise<{ error?: string; mes?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const hoje = new Date();
  const mesAtual = getMesAno(hoje);

  const filtroMes = searchParams?.mes ?? mesAtual;

  // Gerar lista de meses (últimos 12)
  const meses: { valor: string; rotulo: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const valor = getMesAno(d);
    const rotulo = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(d);
    meses.push({ valor, rotulo });
  }

  // Parse o mês para filtrar
  const [anoStr, mesStr] = filtroMes.split("-");
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10);

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

  // Gerar atividades recorrentes para o mês exibido (idempotente)
  await garantirAtividadesRecorrentes(user.id, ano, mes);

  const atividades = await prisma.atividade.findMany({
    where: {
      userId: user.id,
      data: { gte: inicioMes, lte: fimMes },
    },
    include: {
      fonteDeRenda: { select: { id: true, nome: true, modelo: true } },
      recebimentos: { select: { id: true } },
    },
    orderBy: { data: "desc" },
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Atividades</h1>
        <Link
          href="/app/atividades/novo"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Nova Atividade
        </Link>
      </div>

      {searchParams?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {/* Filtro de mês */}
      <form method="GET" className="mb-4 flex gap-2">
        <select
          name="mes"
          defaultValue={filtroMes}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:w-auto"
        >
          {meses.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.rotulo}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium hover:bg-zinc-200"
        >
          Filtrar
        </button>
      </form>

      {atividades.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-400">
          Nenhuma atividade encontrada para este mês.
        </div>
      ) : (
        <div className="space-y-3">
          {atividades.map((atividade) => {
            const statusAtual = statusEfetivo(atividade);
            const statusInfo = rotuloStatus[statusAtual] ?? {
              label: atividade.status,
              cor: "bg-zinc-100 text-zinc-600",
            };
            return (
              <div
                key={atividade.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {rotuloTipoAtividade[atividade.tipo] ?? atividade.tipo}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.cor}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {atividade.fonteDeRenda.nome} &middot;{" "}
                    {formatarData(atividade.data)} &middot;{" "}
                    {formatarValor(atividade.valor)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {atividade.status === "AGENDADA" && (
                    <>
                      <Link
                        href={`/app/atividades/${atividade.id}/editar`}
                        className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-200"
                      >
                        Editar
                      </Link>
                      <RealizarForm id={atividade.id} />
                    </>
                  )}
                  {atividade.status !== "CANCELADA" && (
                    <CancelarForm id={atividade.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function RealizarForm({ id }: { id: string }) {
  return (
    <form action={realizarAtividade}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-100"
      >
        Realizar
      </button>
    </form>
  );
}

function CancelarForm({ id }: { id: string }) {
  return (
    <form action={cancelarAtividade}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
      >
        Cancelar
      </button>
    </form>
  );
}