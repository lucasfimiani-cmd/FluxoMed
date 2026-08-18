import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { editarFonteDeRenda } from "@/lib/fontes/actions";
import { FonteConditionalFields } from "@/components/FonteConditionalFields";

export default async function EditarFontePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const fonte = await prisma.fonteDeRenda.findUnique({
    where: { id },
    include: { precos: true },
  });
  if (!fonte || fonte.userId !== user.id) notFound();

  const perfis = await prisma.perfilFiscal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const precosMap = new Map(
    fonte.precos.map((p) => [p.tipo, p.valor])
  );

  return (
    <AppShell currentPath="/app/fontes">
      <h1 className="mb-6 text-2xl font-bold">Editar Fonte de Renda</h1>

      {sp?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      <FonteForm
        fonte={fonte}
        perfis={perfis}
        precosMap={Object.fromEntries(precosMap)}
      />
    </AppShell>
  );
}

function FonteForm({
  fonte,
  perfis,
  precosMap,
}: {
  fonte: {
    id: string;
    nome: string;
    perfilFiscalId: string;
    modelo: string;
    valorMensal: number | null;
    valorPorAtividade: number | null;
    prazoPagamentoDias: number;
  };
  perfis: { id: string; tipo: string; regime: string; aliquotaEfetiva: number }[];
  precosMap: Record<string, number>;
}) {
  return (
    <form action={editarFonteDeRenda} className="max-w-md space-y-4">
      <input type="hidden" name="id" value={fonte.id} />

      <div>
        <label htmlFor="nome" className="mb-1 block text-sm font-medium">
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          maxLength={100}
          defaultValue={fonte.nome}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Ex.: Hospital São Lucas"
        />
      </div>

      <div>
        <label htmlFor="perfilFiscalId" className="mb-1 block text-sm font-medium">
          Perfil Fiscal
        </label>
        <select
          id="perfilFiscalId"
          name="perfilFiscalId"
          required
          defaultValue={fonte.perfilFiscalId}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Selecione...</option>
          {perfis.map((perfil) => (
            <option key={perfil.id} value={perfil.id}>
              {perfil.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"} —{" "}
              {perfil.aliquotaEfetiva}%
            </option>
          ))}
        </select>
      </div>

      <FonteConditionalFields
        initialModelo={fonte.modelo}
        initialValorMensal={fonte.valorMensal}
        initialValorPorAtividade={fonte.valorPorAtividade}
        initialPrecos={precosMap}
      />

      <div>
        <label htmlFor="prazoPagamentoDias" className="mb-1 block text-sm font-medium">
          Prazo de Pagamento (dias)
        </label>
        <input
          id="prazoPagamentoDias"
          name="prazoPagamentoDias"
          type="number"
          min="0"
          max="365"
          defaultValue={fonte.prazoPagamentoDias}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Ex.: 30"
        />
        <p className="mt-1 text-xs text-zinc-400">0 = à vista</p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Salvar
        </button>
        <Link
          href="/app/fontes"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}