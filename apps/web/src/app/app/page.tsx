import AppShell from "@/components/AppShell";
import Link from "next/link";

export default function AppPage() {
  return (
    <AppShell>
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="mb-2 text-2xl font-bold">Dashboard</h1>
        <p className="mb-6 text-zinc-500">
          Gerencie seus perfis fiscais e finanças.
        </p>
        <Link
          href="/app/perfis"
          className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Ver Perfis Fiscais
        </Link>
      </div>
    </AppShell>
  );
}