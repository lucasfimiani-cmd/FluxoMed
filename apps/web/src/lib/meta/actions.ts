"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CriarMetaFinanceiraSchema, EditarMetaFinanceiraSchema } from "@fluxomed/shared";

export async function criarMeta(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const raw = {
    ano: parseInt(formData.get("ano") as string, 10),
    mes: parseInt(formData.get("mes") as string, 10),
    valorAlvo: parseFloat(formData.get("valorAlvo") as string),
  };

  const parsed = CriarMetaFinanceiraSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(`/app?error=${encodeURIComponent(firstError)}`);
  }

  const data = parsed.data;

  await prisma.metaFinanceira.upsert({
    where: {
      userId_ano_mes: {
        userId: user.id,
        ano: data.ano,
        mes: data.mes,
      },
    },
    update: {
      valorAlvo: data.valorAlvo,
    },
    create: {
      userId: user.id,
      ano: data.ano,
      mes: data.mes,
      valorAlvo: data.valorAlvo,
    },
  });

  revalidatePath("/app");
  redirect("/app");
}

export async function editarMeta(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = formData.get("id") as string;
  const raw = {
    valorAlvo: parseFloat(formData.get("valorAlvo") as string),
  };

  const parsed = EditarMetaFinanceiraSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(`/app?error=${encodeURIComponent(firstError)}`);
  }

  const meta = await prisma.metaFinanceira.findUnique({ where: { id } });
  if (!meta || meta.userId !== user.id) {
    return redirect("/app");
  }

  await prisma.metaFinanceira.update({
    where: { id },
    data: { valorAlvo: parsed.data.valorAlvo },
  });

  revalidatePath("/app");
  redirect("/app");
}