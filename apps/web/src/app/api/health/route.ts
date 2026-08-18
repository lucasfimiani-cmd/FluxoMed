import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Upsert a single probe row: increment hits
  let probe = await prisma.probe.findFirst();

  if (!probe) {
    probe = await prisma.probe.create({
      data: { hits: 1 },
    });
  } else {
    probe = await prisma.probe.update({
      where: { id: probe.id },
      data: { hits: probe.hits + 1 },
    });
  }

  return NextResponse.json({
    status: "ok",
    hits: probe.hits,
    updatedAt: probe.updatedAt.toISOString(),
  });
}