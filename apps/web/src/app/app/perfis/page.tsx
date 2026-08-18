import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

const rotuloTipo: Record<string, string> = {
  PF: "Pessoa Física",
  PJ: "Pessoa Jurídica",
};

const rotuloRegime: Record<string, string> = {
  PF_AUTONOMO: "PF Autônoma",
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
};

export default async function PerfisPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const perfis = await prisma.perfilFiscal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell currentPath="/app/perfis">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Perfis Fiscais</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {perfis.length} perfil{perfis.length !== 1 ? "is" : ""} cadastrado{perfis.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/app/perfis/novo"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Novo Perfil
        </Link>
      </div>

      {searchParams?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {perfis.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">Nenhum perfil fiscal cadastrado.</p>
          <Link
            href="/app/perfis/novo"
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Criar primeiro perfil
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {perfis.map((perfil) => (
            <div
              key={perfil.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-medium text-zinc-800">
                  {rotuloTipo[perfil.tipo] ?? perfil.tipo}
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {rotuloRegime[perfil.regime] ?? perfil.regime} &middot;{" "}
                  {perfil.aliquotaEfetiva}%
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/app/perfis/${perfil.id}/editar`}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
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

async function deleteAction(formData: FormData): Promise<void> {
  "use server";
  const id = formData.get("id") as string;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const perfil = await prisma.perfilFiscal.findUnique({ where: { id } });
  if (!perfil || perfil.userId !== user.id) redirect("/app/perfis");

  try {
    await prisma.perfilFiscal.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      const msg = encodeURIComponent(
        "Este Perfil Fiscal tem Fontes de Renda vinculadas e não pode ser excluído"
      );
      redirect(`/app/perfis?error=${msg}`);
    }
    throw error;
  }
  redirect("/app/perfis");
}

function DeleteForm({ id }: { id: string }) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-100"
      >
        Excluir
      </button>
    </form>
  );
}