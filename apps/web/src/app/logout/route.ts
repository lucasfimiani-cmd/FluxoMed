import { deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function POST() {
  await deleteSession();

  const cookieStore = await cookies();
  cookieStore.set("fluxomed_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/login");
}