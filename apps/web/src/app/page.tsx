import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="mb-2 text-3xl font-bold">FluxoMed</h1>
      <p className="mb-8 text-zinc-500">
        Gestão financeira para profissionais da saúde
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-zinc-300 px-6 py-2 text-sm font-medium hover:bg-zinc-100"
        >
          Criar conta
        </Link>
      </div>
      <div className="mt-12 text-sm text-zinc-400">
        <Link href="/api/health" className="hover:underline">
          Status da aplicação
        </Link>
      </div>
    </main>
  );
}