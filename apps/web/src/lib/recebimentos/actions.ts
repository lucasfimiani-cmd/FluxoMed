"use server";

import { prisma } from "@/lib/prisma";
import { getSessionOrRedirect, parseFormOrRedirect } from "@/lib/actions/guard";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CriarRecebimentoSchema } from "@fluxomed/shared";

export async function criarRecebimento(formData: FormData) {
  const user = await getSessionOrRedirect();

  const raw = {
    fonteDeRendaId: formData.get("fonteDeRendaId") as string,
    valor: parseFloat(formData.get("valor") as string),
    data: formData.get("data") as string,
    observacao: (formData.get("observacao") as string) || null,
  };

  const data = parseFormOrRedirect(CriarRecebimentoSchema, raw, "/app/recebimentos/novo");

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
  const user = await getSessionOrRedirect();

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
  if (atividade.recebimentos?.some((r: { id: string }) => r.id === recebimentoId)) {
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
  const user = await getSessionOrRedirect();

  const recebimentoId = formData.get("recebimentoId") as string;
  const atividadeId = formData.get("atividadeId") as string;

  const recebimento = await prisma.recebimento.findUnique({
    where: { id: recebimentoId },
  });

  if (!recebimento || recebimento.userId !== user.id) {
    return redirect("/app/recebimentos");
  }

  // Validar que a atividade existe e pertence ao usuário
  const atividade = await prisma.atividade.findUnique({
    where: { id: atividadeId },
  });

  if (!atividade || atividade.userId !== user.id) {
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