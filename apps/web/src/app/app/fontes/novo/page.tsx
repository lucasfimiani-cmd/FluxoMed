import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { criarFonteDeRenda } from "@/lib/fontes/actions";
import { FonteConditionalFields } from "@/components/FonteConditionalFields";

export default async function NovaFontePage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const perfis = await prisma.perfilFiscal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (perfis.length === 0) {
    return (
      <AppShell currentPath="/app/fontes">
        <h1 className="mb-6 text-2xl font-bold">Nova Fonte de Renda</h1>
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-400">
          Você precisa cadastrar um{" "}
          <Link href="/app/perfis/novo" className="text-emerald-600 underline">
            Perfil Fiscal
          </Link>{" "}
          primeiro.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/app/fontes">
      <h1 className="mb-6 text-2xl font-bold">Nova Fonte de Renda</h1>

      {searchParams?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      <FonteForm perfis={perfis} />
    </AppShell>
  );
}

function FonteForm({
  perfis,
}: {
  perfis: { id: string; tipo: string; regime: string; aliquotaEfetiva: number }[];
}) {
  return (
    <form action={criarFonteDeRenda} className="max-w-md space-y-4">
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

      <FonteConditionalFields />

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
          defaultValue="30"
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