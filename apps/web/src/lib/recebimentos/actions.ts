"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CriarRecebimentoSchema } from "@fluxomed/shared";

export async function criarRecebimento(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const raw = {
    fonteDeRendaId: formData.get("fonteDeRendaId") as string,
    valor: parseFloat(formData.get("valor") as string),
    data: formData.get("data") as string,
    observacao: (formData.get("observacao") as string) || null,
  };

  const parsed = CriarRecebimentoSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(
      `/app/recebimentos/novo?error=${encodeURIComponent(firstError)}`
    );
  }

  const data = parsed.data;

  // Validar fonte: existe e pertence ao usuário (pode estar inativa)
  const fonte = await prisma.fonteDeRenda.findUnique({
    where: { id: data.fonteDeRendaId },
  });

  if (!fonte || fonte.userId !== user.id) {
    return redirect(
      "/app/recebimentos/novo?error=Fonte+de+renda+inv%C3%A1lida"
    );
  }

  await prisma.recebimento.create({
    data: {
      userId: user.id,
      fonteDeRendaId: data.fonteDeRendaId,
      valor: data.valor,
      data: new Date(data.data + "T12:00:00"),
      observacao: data.observacao ?? null,
    },
  });

  revalidatePath("/app/recebimentos");
  redirect("/app/recebimentos");
}

export async function vincularAtividade(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const recebimentoId = formData.get("recebimentoId") as string;
  const atividadeId = formData.get("atividadeId") as string;

  // Validar recebimento
  const recebimento = await prisma.recebimento.findUnique({
    where: { id: recebimentoId },
  });

  if (!recebimento || recebimento.userId !== user.id) {
    return redirect("/app/recebimentos");
  }

  // Validar atividade
  const atividade = await prisma.atividade.findUnique({
    where: { id: atividadeId },
    include: { recebimentos: { select: { id: true } } },
  });

  if (!atividade || atividade.userId !== user.id) {
    return redirect("/app/recebimentos");
  }

  // Mesma fonte
  if (atividade.fonteDeRendaId !== recebimento.fonteDeRendaId) {
    const msg = encodeURIComponent(
      "Atividade deve ser da mesma fonte de renda do recebimento"
    );
    return redirect(`/app/recebimentos/${recebimentoId}?error=${msg}`);
  }

  // Status REALIZADA
  if (atividade.status !== "REALIZADA") {
    const msg = encodeURIComponent(
      "Apenas atividades realizadas podem ser vinculadas a um recebimento"
    );
    return redirect(`/app/recebimentos/${recebimentoId}?error=${msg}`);
  }

  // Já vinculada a este recebimento
  if (atividade.recebimentos?.some((r) => r.id === recebimentoId)) {
    const msg = encodeURIComponent(
      "Atividade já vinculada a este recebimento"
    );
    return redirect(`/app/recebimentos/${recebimentoId}?error=${msg}`);
  }

  await prisma.atividade.update({
    where: { id: atividadeId },
    data: {
      recebimentos: {
        connect: { id: recebimentoId },
      },
    },
  });

  revalidatePath(`/app/recebimentos/${recebimentoId}`);
  revalidatePath("/app/recebimentos");
  revalidatePath("/app/atividades");
  redirect(`/app/recebimentos/${recebimentoId}`);
}

export async function desvincularAtividade(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const recebimentoId = formData.get("recebimentoId") as string;
  const atividadeId = formData.get("atividadeId") as string;

  const recebimento = await prisma.recebimento.findUnique({
    where: { id: recebimentoId },
  });

  if (!recebimento || recebimento.userId !== user.id) {
    return redirect("/app/recebimentos");
  }

  await prisma.atividade.update({
    where: { id: atividadeId },
    data: {
      recebimentos: {
        disconnect: { id: recebimentoId },
      },
    },
  });

  revalidatePath(`/app/recebimentos/${recebimentoId}`);
  revalidatePath("/app/recebimentos");
  revalidatePath("/app/atividades");
  redirect(`/app/recebimentos/${recebimentoId}`);
}