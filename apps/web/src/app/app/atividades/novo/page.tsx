import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { criarAtividade } from "@/lib/atividades/actions";

const rotuloModelo: Record<string, string> = {
  FIXO_MENSAL: "Fixo Mensal",
  POR_ATIVIDADE: "Por Atividade",
  POR_UNIDADE: "Por Unidade",
};

export default async function NovaAtividadePage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const fontes = await prisma.fonteDeRenda.findMany({
    where: { userId: user.id, ativa: true },
    orderBy: { nome: "asc" },
  });

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <AppShell currentPath="/app/atividades">
      <h1 className="mb-6 text-2xl font-bold">Nova Atividade</h1>

      {searchParams?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {fontes.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">
            Você precisa ter uma{" "}
            <Link href="/app/fontes/novo" className="text-emerald-600 underline">
              Fonte de Renda
            </Link>{" "}
            ativa para registrar uma atividade.
          </p>
        </div>
      ) : (
        <AtividadeForm fontes={fontes} hoje={hoje} />
      )}
    </AppShell>
  );
}

function AtividadeForm({
  fontes,
  hoje,
}: {
  fontes: { id: string; nome: string; modelo: string }[];
  hoje: string;
}) {
  return (
    <form action={criarAtividade} className="max-w-md space-y-4">
      <div>
        <label htmlFor="tipo" className="mb-1 block text-sm font-medium">
          Tipo de Atividade
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Selecione...</option>
          <option value="PLANTAO">Plantão</option>
          <option value="CONSULTA">Consulta</option>
          <option value="PROCEDIMENTO">Procedimento</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>

      <div>
        <label htmlFor="fonteDeRendaId" className="mb-1 block text-sm font-medium">
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
              {fonte.nome} — {rotuloModelo[fonte.modelo] ?? fonte.modelo}
            </option>
          ))}
        </select>
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

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Salvar
        </button>
        <Link
          href="/app/atividades"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}