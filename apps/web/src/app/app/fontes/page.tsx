import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { toggleAtivaFonteDeRenda } from "@/lib/fontes/actions";

const rotuloModelo: Record<string, string> = {
  FIXO_MENSAL: "Fixo Mensal",
  POR_ATIVIDADE: "Por Atividade",
  POR_UNIDADE: "Por Unidade",
};

const rotuloTipo: Record<string, string> = {
  PF: "Pessoa Física",
  PJ: "Pessoa Jurídica",
};

export default async function FontesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const fontes = await prisma.fonteDeRenda.findMany({
    where: { userId: user.id },
    include: {
      perfilFiscal: { select: { id: true, tipo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fontes de Renda</h1>
        <Link
          href="/app/fontes/novo"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Nova Fonte
        </Link>
      </div>

      {fontes.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-400">
          Nenhuma fonte de renda cadastrada.
        </div>
      ) : (
        <div className="space-y-3">
          {fontes.map((fonte) => (
            <div
              key={fonte.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{fonte.nome}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      fonte.ativa
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {fonte.ativa ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <p className="text-sm text-zinc-500">
                  {rotuloTipo[fonte.perfilFiscal.tipo] ??
                    fonte.perfilFiscal.tipo}{" "}
                  &middot; {rotuloModelo[fonte.modelo] ?? fonte.modelo} &middot;{" "}
                  {fonte.prazoPagamentoDias === 0
                    ? "À vista"
                    : `${fonte.prazoPagamentoDias} dias`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/app/fontes/${fonte.id}/editar`}
                  className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-200"
                >
                  Editar
                </Link>
                <ToggleAtivaForm
                  id={fonte.id}
                  ativa={fonte.ativa}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ToggleAtivaForm({ id, ativa }: { id: string; ativa: boolean }) {
  return (
    <form action={toggleAtivaFonteDeRenda}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={`rounded-lg px-3 py-1.5 text-sm ${
          ativa
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
        }`}
      >
        {ativa ? "Desativar" : "Reativar"}
      </button>
    </form>
  );
}