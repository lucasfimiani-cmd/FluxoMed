import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatarAjuste, calcularAjuste } from "@/lib/recebimentos/ajuste";

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

export default async function RecebimentosPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const recebimentos = await prisma.recebimento.findMany({
    where: { userId: user.id },
    include: {
      fonteDeRenda: { select: { id: true, nome: true } },
      atividades: { select: { id: true, valor: true } },
    },
    orderBy: { data: "desc" },
  });

  return (
    <AppShell currentPath="/app/recebimentos">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Recebimentos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {recebimentos.length} recebimento{recebimentos.length !== 1 ? "s" : ""} registrado{recebimentos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/app/recebimentos/novo"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Novo Recebimento
        </Link>
      </div>

      {searchParams?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {recebimentos.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">Nenhum recebimento registrado.</p>
          <Link
            href="/app/recebimentos/novo"
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Registrar primeiro recebimento
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recebimentos.map((rec) => {
            const somaVinculada = rec.atividades.reduce(
              (acc, a) => acc + a.valor,
              0
            );
            const ajuste = calcularAjuste({
              valor: rec.valor,
              atividades: rec.atividades,
            });
            return (
              <Link
                key={rec.id}
                href={`/app/recebimentos/${rec.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-800">{rec.fonteDeRenda.nome}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {formatarData(rec.data)} &middot;{" "}
                      {rec.atividades.length} atividade
                      {rec.atividades.length !== 1 ? "s" : ""} vinculada
                      {rec.atividades.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-800">
                      {formatarValor(rec.valor)}
                    </p>
                    <p
                      className={`text-sm ${
                        ajuste < 0
                          ? "text-red-600"
                          : ajuste > 0
                          ? "text-emerald-600"
                          : "text-zinc-400"
                      }`}
                    >
                      Ajuste: {formatarAjuste(ajuste)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}