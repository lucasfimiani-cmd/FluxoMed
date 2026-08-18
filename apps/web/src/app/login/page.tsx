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
    <div className="mx-auto mt-16 max-w-md px-4">
      <h1 className="mb-6 text-2xl font-bold">Entrar</h1>

      {params.error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      <LoginForm />
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
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Sua senha"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Entrar
      </button>
      <p className="text-center text-sm text-zinc-500">
        Ainda não tem conta?{" "}
        <Link href="/register" className="text-emerald-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}