import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { editarAtividade } from "@/lib/atividades/actions";

const rotuloModelo: Record<string, string> = {
  FIXO_MENSAL: "Fixo Mensal",
  POR_ATIVIDADE: "Por Atividade",
  POR_UNIDADE: "Por Unidade",
};

export default async function EditarAtividadePage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const atividade = await prisma.atividade.findUnique({
    where: { id },
    include: {
      fonteDeRenda: { select: { id: true, nome: true, modelo: true } },
    },
  });

  if (!atividade || atividade.userId !== user.id) notFound();

  const fontes = await prisma.fonteDeRenda.findMany({
    where: { userId: user.id, ativa: true },
    orderBy: { nome: "asc" },
  });

  const dataStr = atividade.data.toISOString().split("T")[0];

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">Editar Atividade</h1>

      {sp?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      <AtividadeForm
        atividade={atividade}
        fontes={fontes}
        dataStr={dataStr}
      />
    </AppShell>
  );
}

function AtividadeForm({
  atividade,
  fontes,
  dataStr,
}: {
  atividade: {
    id: string;
    tipo: string;
    fonteDeRendaId: string;
    data: Date;
    status: string;
  };
  fontes: { id: string; nome: string; modelo: string }[];
  dataStr: string;
}) {
  return (
    <form action={editarAtividade} className="max-w-md space-y-4">
      <input type="hidden" name="id" value={atividade.id} />

      <div>
        <label htmlFor="tipo" className="mb-1 block text-sm font-medium">
          Tipo de Atividade
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue={atividade.tipo}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="PLANTAO">Plantão</option>
          <option value="CONSULTA">Consulta</option>
          <option value="PROCEDIMENTO">Procedimento</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>

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
          defaultValue={atividade.fonteDeRendaId}
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
          defaultValue={dataStr}
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