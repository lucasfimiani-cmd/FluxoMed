import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Simple health check — verify DB connectivity
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      db: "connected",
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Database connection failed" },
      { status: 500 }
    );
  }
}