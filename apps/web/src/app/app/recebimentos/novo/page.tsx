import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { criarRecebimento } from "@/lib/recebimentos/actions";

export default async function NovoRecebimentoPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const fontes = await prisma.fonteDeRenda.findMany({
    where: { userId: user.id },
    orderBy: { nome: "asc" },
  });

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">Novo Recebimento</h1>

      {searchParams?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {fontes.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-400">
          Você precisa ter uma{" "}
          <Link href="/app/fontes/novo" className="text-emerald-600 underline">
            Fonte de Renda
          </Link>{" "}
          para registrar um recebimento.
        </div>
      ) : (
        <RecebimentoForm fontes={fontes} hoje={hoje} />
      )}
    </AppShell>
  );
}

function RecebimentoForm({
  fontes,
  hoje,
}: {
  fontes: { id: string; nome: string }[];
  hoje: string;
}) {
  return (
    <form action={criarRecebimento} className="max-w-md space-y-4">
      <div>
        <label
          htmlFor="fonteDeRendaId"
          className="mb-1 block text-sm font-medium"
        >
          Fonte de Renda
        </label>
        <select
          id="fonteDeRendaId"
          name="fonteDeRendaId"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Selecione...</option>
          {fontes.map((fonte) => (
            <option key={fonte.id} value={fonte.id}>
              {fonte.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="valor" className="mb-1 block text-sm font-medium">
          Valor (R$)
        </label>
        <input
          id="valor"
          name="valor"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Ex.: 1750.00"
        />
      </div>

      <div>
        <label htmlFor="data" className="mb-1 block text-sm font-medium">
          Data
        </label>
        <input
          id="data"
          name="data"
          type="date"
          required
          defaultValue={hoje}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="observacao" className="mb-1 block text-sm font-medium">
          Observação (opcional)
        </label>
        <textarea
          id="observacao"
          name="observacao"
          maxLength={300}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Ex.: Pagamento referente ao mês de julho"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Salvar
        </button>
        <Link
          href="/app/recebimentos"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}