import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { editarFonteDeRenda } from "@/lib/fontes/actions";

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
    <AppShell>
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
        <label
          htmlFor="perfilFiscalId"
          className="mb-1 block text-sm font-medium"
        >
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

      <div>
        <label htmlFor="modelo" className="mb-1 block text-sm font-medium">
          Modelo de Remuneração
        </label>
        <select
          id="modelo"
          name="modelo"
          required
          defaultValue={fonte.modelo}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="FIXO_MENSAL">Fixo Mensal</option>
          <option value="POR_ATIVIDADE">Por Atividade</option>
          <option value="POR_UNIDADE">Por Unidade (tabela de preços)</option>
        </select>
      </div>

      <div id="campo-valor-mensal">
        <label htmlFor="valorMensal" className="mb-1 block text-sm font-medium">
          Valor Mensal (R$)
        </label>
        <p className="mb-1 text-xs text-zinc-400">
          Apenas para modelo Fixo Mensal.
        </p>
        <input
          id="valorMensal"
          name="valorMensal"
          type="number"
          step="0.01"
          min="0"
          defaultValue={fonte.valorMensal ?? undefined}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Ex.: 5000.00"
        />
      </div>

      <div id="campo-valor-atividade">
        <label
          htmlFor="valorPorAtividade"
          className="mb-1 block text-sm font-medium"
        >
          Valor por Atividade (R$)
        </label>
        <p className="mb-1 text-xs text-zinc-400">
          Apenas para modelo Por Atividade.
        </p>
        <input
          id="valorPorAtividade"
          name="valorPorAtividade"
          type="number"
          step="0.01"
          min="0"
          defaultValue={fonte.valorPorAtividade ?? undefined}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Ex.: 350.00"
        />
      </div>

      <div id="campo-precos">
        <label className="mb-1 block text-sm font-medium">
          Tabela de Preços por Tipo de Atividade
        </label>
        <p className="mb-1 text-xs text-zinc-400">
          Apenas para modelo Por Unidade. Preencha pelo menos um tipo.
        </p>
        <div className="space-y-2">
          {[
            { tipo: "PLANTAO", label: "Plantão" },
            { tipo: "CONSULTA", label: "Consulta" },
            { tipo: "PROCEDIMENTO", label: "Procedimento" },
            { tipo: "OUTRO", label: "Outro" },
          ].map(({ tipo, label }) => (
            <div key={tipo} className="flex items-center gap-2">
              <span className="w-28 text-sm text-zinc-600">{label}</span>
              <input
                id={`preco_${tipo}`}
                name={`preco_${tipo}`}
                type="number"
                step="0.01"
                min="0"
                defaultValue={precosMap[tipo] ?? undefined}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Valor (R$)"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="prazoPagamentoDias"
          className="mb-1 block text-sm font-medium"
        >
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