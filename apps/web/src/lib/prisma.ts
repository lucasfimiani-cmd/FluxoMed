import { PrismaClient } from "@prisma/client";

// Support DATABASE_PATH env var for Docker/multi-instance deployments.
// When DATABASE_PATH is set and DATABASE_URL is not, construct the URL from it.
// This allows each container to point to its own SQLite file via a single env var.
if (process.env.DATABASE_PATH && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${process.env.DATABASE_PATH}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Enable WAL mode for better concurrent performance
prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL").catch(() => {
  // Ignore errors — WAL is a best-effort optimization
});

export { prisma as db };