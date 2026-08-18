"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CriarAtividadeSchema, EditarAtividadeSchema } from "@fluxomed/shared";
import { TipoAtividade } from "@prisma/client";
import { calcularValorAtividade, podeEditar } from "./valor";

export async function criarAtividade(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const raw = {
    tipo: formData.get("tipo") as string,
    fonteDeRendaId: formData.get("fonteDeRendaId") as string,
    data: formData.get("data") as string,
  };

  const parsed = CriarAtividadeSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(
      `/app/atividades/novo?error=${encodeURIComponent(firstError)}`
    );
  }

  const data = parsed.data;

  // Validar fonte: existe, pertence ao usuário e está ativa
  const fonte = await prisma.fonteDeRenda.findUnique({
    where: { id: data.fonteDeRendaId },
    include: { precos: true },
  });

  if (!fonte || fonte.userId !== user.id || !fonte.ativa) {
    return redirect(
      "/app/atividades/novo?error=Fonte+de+renda+inv%C3%A1lida+ou+inativa"
    );
  }

  // Calcular valor
  let valor: number;
  try {
    valor = calcularValorAtividade(
      {
        modelo: fonte.modelo,
        valorMensal: fonte.valorMensal,
        valorPorAtividade: fonte.valorPorAtividade,
        precos: fonte.precos.map((p) => ({ tipo: p.tipo, valor: p.valor })),
      },
      data.tipo
    );
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Erro ao calcular valor da atividade";
    return redirect(
      `/app/atividades/novo?error=${encodeURIComponent(msg)}`
    );
  }

  await prisma.atividade.create({
    data: {
      userId: user.id,
      fonteDeRendaId: data.fonteDeRendaId,
      tipo: data.tipo as TipoAtividade,
      data: new Date(data.data + "T12:00:00"),
      status: "AGENDADA",
      valor,
    },
  });

  revalidatePath("/app/atividades");
  redirect("/app/atividades");
}

export async function editarAtividade(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = formData.get("id") as string;

  // Buscar atividade existente
  const atividade = await prisma.atividade.findUnique({
    where: { id },
  });

  if (!atividade || atividade.userId !== user.id) {
    return redirect("/app/atividades");
  }

  // Verificar se pode editar (não cancelada)
  const pode = podeEditar({ status: atividade.status });
  if (!pode.permitido) {
    const msg = encodeURIComponent(pode.mensagem ?? "Atividade não pode ser editada");
    return redirect(`/app/atividades?error=${msg}`);
  }

  const raw = {
    tipo: formData.get("tipo") as string,
    fonteDeRendaId: formData.get("fonteDeRendaId") as string,
    data: formData.get("data") as string,
  };

  const parsed = EditarAtividadeSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(
      `/app/atividades/${id}/editar?error=${encodeURIComponent(firstError)}`
    );
  }

  const data = parsed.data;

  // Validar fonte
  const fonte = await prisma.fonteDeRenda.findUnique({
    where: { id: data.fonteDeRendaId },
    include: { precos: true },
  });

  if (!fonte || fonte.userId !== user.id || !fonte.ativa) {
    return redirect(
      `/app/atividades/${id}/editar?error=Fonte+de+renda+inv%C3%A1lida+ou+inativa`
    );
  }

  // Recalcular valor
  let valor: number;
  try {
    valor = calcularValorAtividade(
      {
        modelo: fonte.modelo,
        valorMensal: fonte.valorMensal,
        valorPorAtividade: fonte.valorPorAtividade,
        precos: fonte.precos.map((p) => ({ tipo: p.tipo, valor: p.valor })),
      },
      data.tipo
    );
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Erro ao calcular valor da atividade";
    return redirect(
      `/app/atividades/${id}/editar?error=${encodeURIComponent(msg)}`
    );
  }

  await prisma.atividade.update({
    where: { id },
    data: {
      tipo: data.tipo as TipoAtividade,
      fonteDeRendaId: data.fonteDeRendaId,
      data: new Date(data.data + "T12:00:00"),
      valor,
    },
  });

  revalidatePath("/app/atividades");
  redirect("/app/atividades");
}

export async function realizarAtividade(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = formData.get("id") as string;

  const atividade = await prisma.atividade.findUnique({
    where: { id },
  });

  if (!atividade || atividade.userId !== user.id) {
    return redirect("/app/atividades");
  }

  if (atividade.status !== "AGENDADA") {
    const msg = encodeURIComponent(
      "Apenas atividades agendadas podem ser realizadas"
    );
    return redirect(`/app/atividades?error=${msg}`);
  }

  await prisma.atividade.update({
    where: { id },
    data: { status: "REALIZADA" },
  });

  revalidatePath("/app/atividades");
  redirect("/app/atividades");
}

export async function cancelarAtividade(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = formData.get("id") as string;

  const atividade = await prisma.atividade.findUnique({
    where: { id },
  });

  if (!atividade || atividade.userId !== user.id) {
    return redirect("/app/atividades");
  }

  if (atividade.status === "CANCELADA") {
    const msg = encodeURIComponent("Atividade já está cancelada");
    return redirect(`/app/atividades?error=${msg}`);
  }

  await prisma.atividade.update({
    where: { id },
    data: { status: "CANCELADA" },
  });

  revalidatePath("/app/atividades");
  redirect("/app/atividades");
}