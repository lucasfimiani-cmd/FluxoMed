import { RegisterSchema } from "@fluxomed/shared";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-lg shadow-brand-200">
            F
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">FluxoMed</span>
          <p className="mt-1 text-sm text-zinc-500">
            Gestão financeira para profissionais da saúde
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="mb-5 text-base font-semibold text-zinc-800">Criar conta</h1>
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

async function registerAction(formData: FormData) {
  "use server";

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return redirect(`/register?error=${encodeURIComponent(firstError)}`);
  }

  // Single-instance check (ADR-0009)
  const existingUser = await prisma.user.findFirst();
  if (existingUser) {
    return redirect("/login?error=Já existe uma conta cadastrada. Faça login.");
  }

  // Check email uniqueness
  const emailTaken = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (emailTaken) {
    return redirect(
      `/register?error=${encodeURIComponent("Este email já está cadastrado")}`
    );
  }

  const passwordHash = hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

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

function RegisterForm() {
  return (
    <form action={registerAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Seu nome"
        />
      </div>
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
          minLength={8}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        Criar conta
      </button>
    </form>
  );
}