import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/perfis", label: "Perfis Fiscais" },
  { href: "/app/fontes", label: "Fontes de Renda" },
  { href: "/app/atividades", label: "Atividades" },
  { href: "/app/recebimentos", label: "Recebimentos" },
] as const;

export default async function AppShell({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath?: string;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const activePath = currentPath ?? "/app";

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/app"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-brand-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                F
              </span>
              FluxoMed
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/app"
                    ? activePath === "/app"
                    : activePath.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-sm text-zinc-500 sm:block">
                {user.name}
              </span>
            </div>
            <form action="/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex gap-1 border-t border-zinc-100 px-4 py-2 sm:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/app"
                ? activePath === "/app"
                : activePath.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}