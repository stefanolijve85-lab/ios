import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap" style={{ padding: "96px 20px" }}>
      <h1>Pagina niet gevonden</h1>
      <p className="lead">Deze pagina bestaat niet (meer).</p>
      <Link href="/" className="btn btn-primary">Naar de homepage</Link>
    </main>
  );
}
