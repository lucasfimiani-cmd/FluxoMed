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
  AGENDADA: { label: "Agendada", cor: "bg-amber-100 text-amber-700 ring-1 ring-amber-200" },
  REALIZADA: { label: "Realizada", cor: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  CANCELADA: { label: "Cancelada", cor: "bg-red-100 text-red-700 ring-1 ring-red-200" },
  RECEBIDA: { label: "Recebida", cor: "bg-blue-100 text-blue-700 ring-1 ring-blue-200" },
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

  const [anoStr, mesStr] = filtroMes.split("-");
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10);

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

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
    <AppShell currentPath="/app/atividades">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Atividades</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {atividades.length} atividade{atividades.length !== 1 ? "s" : ""} no período
          </p>
        </div>
        <Link
          href="/app/atividades/novo"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Nova Atividade
        </Link>
      </div>

      {searchParams?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      <form method="GET" className="mb-5 flex gap-2">
        <select
          name="mes"
          defaultValue={filtroMes}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-auto"
        >
          {meses.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.rotulo}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Filtrar
        </button>
      </form>

      {atividades.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">Nenhuma atividade encontrada para este mês.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {atividades.map((atividade) => {
            const statusAtual = statusEfetivo(atividade);
            const statusInfo = rotuloStatus[statusAtual] ?? {
              label: atividade.status,
              cor: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200",
            };
            return (
              <div
                key={atividade.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-800">
                        {rotuloTipoAtividade[atividade.tipo] ?? atividade.tipo}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.cor}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-500">
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
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
                        >
                          Editar
                        </Link>
                        <RealizarForm id={atividade.id} />
                      </>
                    )}
                    {(statusAtual === "AGENDADA" || statusAtual === "REALIZADA") && (
                      <CancelarForm id={atividade.id} />
                    )}
                  </div>
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
        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
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
        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
      >
        Cancelar
      </button>
    </form>
  );
}