import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ZodSchema } from "zod";

/**
 * Retorna o usuário logado ou redireciona para /login.
 */
export async function getSessionOrRedirect() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Faz safeParse de um objeto com o schema e redireciona com erro em caso de falha.
 * `fallbackPath` é usado como base para o redirect com query param `error`.
 * Exemplo: fallbackPath = "/app/fontes/novo" → "/app/fontes/novo?error=..."
 */
export function parseFormOrRedirect<T>(
  schema: ZodSchema<T>,
  raw: Record<string, unknown>,
  fallbackPath: string
): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(
      `${fallbackPath}?error=${encodeURIComponent(firstError)}`
    ) as unknown as T;
  }
  return parsed.data;
}