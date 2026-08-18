"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CriarFonteDeRendaSchema } from "@fluxomed/shared";
import { Prisma } from "@prisma/client";

export async function criarFonteDeRenda(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const raw = {
    nome: formData.get("nome") as string,
    perfilFiscalId: formData.get("perfilFiscalId") as string,
    modelo: formData.get("modelo") as string,
    valorMensal: formData.get("valorMensal")
      ? parseFloat(formData.get("valorMensal") as string)
      : null,
    valorPorAtividade: formData.get("valorPorAtividade")
      ? parseFloat(formData.get("valorPorAtividade") as string)
      : null,
    prazoPagamentoDias: parseInt(
      formData.get("prazoPagamentoDias") as string,
      10
    ),
    precos: parsePrecos(formData),
  };

  const parsed = CriarFonteDeRendaSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(
      `/app/fontes/novo?error=${encodeURIComponent(firstError)}`
    );
  }

  const data = parsed.data;

  // Verificar se o perfil pertence ao usuário
  const perfil = await prisma.perfilFiscal.findUnique({
    where: { id: data.perfilFiscalId },
  });
  if (!perfil || perfil.userId !== user.id) {
    return redirect("/app/fontes/novo?error=Perfil+fiscal+inv%C3%A1lido");
  }

  await prisma.fonteDeRenda.create({
    data: {
      userId: user.id,
      perfilFiscalId: data.perfilFiscalId,
      nome: data.nome,
      modelo: data.modelo as any,
      valorMensal: data.valorMensal ?? null,
      valorPorAtividade: data.valorPorAtividade ?? null,
      prazoPagamentoDias: data.prazoPagamentoDias,
      precos:
        data.precos && data.precos.length > 0
          ? {
              createMany: {
                data: data.precos
                  .filter((p) => p.valor > 0)
                  .map((p) => ({
                    tipo: p.tipo as any,
                    valor: p.valor,
                  })),
              },
            }
          : undefined,
    },
  });

  redirect("/app/fontes");
}

export async function editarFonteDeRenda(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = formData.get("id") as string;

  const fonte = await prisma.fonteDeRenda.findUnique({
    where: { id },
    include: { precos: true },
  });
  if (!fonte || fonte.userId !== user.id) {
    return redirect("/app/fontes");
  }

  const raw = {
    nome: formData.get("nome") as string,
    perfilFiscalId: formData.get("perfilFiscalId") as string,
    modelo: formData.get("modelo") as string,
    valorMensal: formData.get("valorMensal")
      ? parseFloat(formData.get("valorMensal") as string)
      : null,
    valorPorAtividade: formData.get("valorPorAtividade")
      ? parseFloat(formData.get("valorPorAtividade") as string)
      : null,
    prazoPagamentoDias: parseInt(
      formData.get("prazoPagamentoDias") as string,
      10
    ),
    precos: parsePrecos(formData),
  };

  const parsed = CriarFonteDeRendaSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(
      `/app/fontes/${id}/editar?error=${encodeURIComponent(firstError)}`
    );
  }

  const data = parsed.data;

  // Verificar se o perfil pertence ao usuário
  const perfil = await prisma.perfilFiscal.findUnique({
    where: { id: data.perfilFiscalId },
  });
  if (!perfil || perfil.userId !== user.id) {
    return redirect(
      `/app/fontes/${id}/editar?error=Perfil+fiscal+inv%C3%A1lido`
    );
  }

  // Atualizar fonte e substituir preços
  await prisma.$transaction(async (tx) => {
    await tx.fonteDeRenda.update({
      where: { id },
      data: {
        perfilFiscalId: data.perfilFiscalId,
        nome: data.nome,
        modelo: data.modelo as any,
        valorMensal: data.valorMensal ?? null,
        valorPorAtividade: data.valorPorAtividade ?? null,
        prazoPagamentoDias: data.prazoPagamentoDias,
      },
    });

    // Substituir preços
    await tx.precoAtividade.deleteMany({
      where: { fonteDeRendaId: id },
    });

    if (data.precos && data.precos.length > 0) {
      await tx.precoAtividade.createMany({
        data: data.precos
          .filter((p) => p.valor > 0)
          .map((p) => ({
            fonteDeRendaId: id,
            tipo: p.tipo as any,
            valor: p.valor,
          })),
      });
    }
  });

  redirect("/app/fontes");
}

export async function toggleAtivaFonteDeRenda(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const id = formData.get("id") as string;

  const fonte = await prisma.fonteDeRenda.findUnique({ where: { id } });
  if (!fonte || fonte.userId !== user.id) {
    return redirect("/app/fontes");
  }

  await prisma.fonteDeRenda.update({
    where: { id },
    data: { ativa: !fonte.ativa },
  });

  redirect("/app/fontes");
}

function parsePrecos(formData: FormData) {
  const tipos = ["PLANTAO", "CONSULTA", "PROCEDIMENTO", "OUTRO"];
  const precos: { tipo: string; valor: number }[] = [];

  for (const tipo of tipos) {
    const valor = formData.get(`preco_${tipo}`) as string;
    if (valor && valor.trim() !== "") {
      precos.push({ tipo, valor: parseFloat(valor) });
    }
  }

  return precos;
}