import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/app" className="text-xl font-bold text-emerald-700">
            FluxoMed
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/app/perfis"
              className="text-zinc-500 hover:text-zinc-900"
            >
              Perfis Fiscais
            </Link>
            <Link
              href="/app/fontes"
              className="text-zinc-500 hover:text-zinc-900"
            >
              Fontes de Renda
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{user.name}</span>
          <form action="/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-300"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}