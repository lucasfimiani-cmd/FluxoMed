import { LoginSchema } from "@fluxomed/shared";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSession,
  setSessionCookie,
} from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-lg shadow-brand-200">
            F
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">FluxoMed</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gestão financeira para profissionais da saúde
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-zinc-800">Entrar</h2>

          {params.error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {params.error}
            </div>
          )}

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

async function loginAction(formData: FormData) {
  "use server";

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(`/login?error=${encodeURIComponent(firstError)}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return redirect(
      `/login?error=${encodeURIComponent("Email ou senha inválidos")}`
    );
  }

  const token = await createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set("fluxomed_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/app");
}

function LoginForm() {
  return (
    <form action={loginAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Sua senha"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        Entrar
      </button>
    </form>
  );
}