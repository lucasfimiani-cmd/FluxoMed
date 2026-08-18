import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>FluxoMed</h1>
      <p>Gestão financeira para profissionais da saúde</p>
      <ul>
        <li>
          <Link href="/api/health">Status da aplicação (API)</Link>
        </li>
      </ul>
    </main>
  );
}