import AppShell from "@/components/AppShell";
import { CriarPerfilFiscalSchema } from "@fluxomed/shared";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditarPerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const perfil = await prisma.perfilFiscal.findUnique({ where: { id } });
  if (!perfil || perfil.userId !== user.id) notFound();

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">Editar Perfil Fiscal</h1>
      <PerfilForm perfil={perfil} />
    </AppShell>
  );
}

async function editarAction(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const perfil = await prisma.perfilFiscal.findUnique({ where: { id } });
  if (!perfil || perfil.userId !== user.id) redirect("/app/perfis");

  const raw: Record<string, unknown> = {};
  const tipo = formData.get("tipo") as string;
  const regime = formData.get("regime") as string;
  const aliquotaRaw = formData.get("aliquotaEfetiva") as string;

  if (tipo) raw.tipo = tipo;
  if (regime) raw.regime = regime;
  if (aliquotaRaw) raw.aliquotaEfetiva = parseFloat(aliquotaRaw);

  const parsed = CriarPerfilFiscalSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(
      `/app/perfis/${id}/editar?error=${encodeURIComponent(firstError)}`
    );
  }

  const aliquota = Math.round(parsed.data.aliquotaEfetiva * 100) / 100;

  await prisma.perfilFiscal.update({
    where: { id },
    data: {
      tipo: parsed.data.tipo,
      regime: parsed.data.regime,
      aliquotaEfetiva: aliquota,
    },
  });

  redirect("/app/perfis");
}

function PerfilForm({
  perfil,
}: {
  perfil: { id: string; tipo: string; regime: string; aliquotaEfetiva: number };
}) {
  return (
    <form action={editarAction} className="max-w-md space-y-4">
      <input type="hidden" name="id" value={perfil.id} />
      <div>
        <label htmlFor="tipo" className="mb-1 block text-sm font-medium">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue={perfil.tipo}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="PF">Pessoa Física (PF)</option>
          <option value="PJ">Pessoa Jurídica (PJ)</option>
        </select>
      </div>
      <div>
        <label htmlFor="regime" className="mb-1 block text-sm font-medium">
          Regime Tributário
        </label>
        <select
          id="regime"
          name="regime"
          required
          defaultValue={perfil.regime}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="PF_AUTONOMO">PF Autônoma</option>
          <option value="SIMPLES_NACIONAL">Simples Nacional</option>
          <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="aliquotaEfetiva"
          className="mb-1 block text-sm font-medium"
        >
          Alíquota Efetiva (%)
        </label>
        <input
          id="aliquotaEfetiva"
          name="aliquotaEfetiva"
          type="number"
          step="0.01"
          min="0"
          max="100"
          required
          defaultValue={perfil.aliquotaEfetiva}
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
          href="/app/perfis"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}