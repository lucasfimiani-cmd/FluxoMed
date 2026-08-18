import { RegisterSchema } from "@fluxomed/shared";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <h1 className="mb-6 text-2xl font-bold">Criar conta</h1>
      <RegisterForm />
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
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Seu nome"
        />
      </div>
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
          minLength={8}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Criar conta
      </button>
      <p className="text-center text-sm text-zinc-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-emerald-600 hover:underline">
          Fazer login
        </Link>
      </p>
    </form>
  );
}