import { getSessionUser, deleteSession, clearSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <form action="/logout" method="POST">
          <button
            type="submit"
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-300"
          >
            Sair
          </button>
        </form>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-lg font-medium">Bem-vindo, {user.name}!</p>
        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
        <hr className="my-4" />
        <p className="text-sm text-zinc-400">Dashboard — em construção</p>
      </div>
    </div>
  );
}