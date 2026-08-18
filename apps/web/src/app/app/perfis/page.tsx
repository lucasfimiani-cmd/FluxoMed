import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const rotuloTipo: Record<string, string> = {
  PF: "Pessoa Física",
  PJ: "Pessoa Jurídica",
};

const rotuloRegime: Record<string, string> = {
  PF_AUTONOMO: "PF Autônoma",
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
};

export default async function PerfisPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const perfis = await prisma.perfilFiscal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Perfis Fiscais</h1>
        <Link
          href="/app/perfis/novo"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Novo Perfil
        </Link>
      </div>

      {perfis.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-400">
          Nenhum perfil fiscal cadastrado.
        </div>
      ) : (
        <div className="space-y-3">
          {perfis.map((perfil) => (
            <div
              key={perfil.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div>
                <p className="font-medium">
                  {rotuloTipo[perfil.tipo] ?? perfil.tipo}
                </p>
                <p className="text-sm text-zinc-500">
                  {rotuloRegime[perfil.regime] ?? perfil.regime} &middot;{" "}
                  {perfil.aliquotaEfetiva}%
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/app/perfis/${perfil.id}/editar`}
                  className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-200"
                >
                  Editar
                </Link>
                <DeleteForm id={perfil.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

async function deleteAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const perfil = await prisma.perfilFiscal.findUnique({ where: { id } });
  if (!perfil || perfil.userId !== user.id) redirect("/app/perfis");

  await prisma.perfilFiscal.delete({ where: { id } });
  redirect("/app/perfis");
}

function DeleteForm({ id }: { id: string }) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
      >
        Excluir
      </button>
    </form>
  );
}