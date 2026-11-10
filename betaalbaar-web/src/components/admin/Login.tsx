"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form style={{ maxWidth: 420 }} onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setError("");
      const res = await fetch("/api/beheer/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await res.json().catch(() => null);
      setBusy(false);
      if (res.ok && data?.ok) router.refresh(); else setError(data?.message ?? "Inloggen is niet gelukt.");
    }}>
      <h1>Beheer</h1>
      <div className="field">
        <label htmlFor="pw">Wachtwoord</label>
        <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="err" role="alert">{error}</p>}
      </div>
      <button className="btn btn-primary" disabled={busy}>Inloggen</button>
    </form>
  );
}

export function Logout() {
  const router = useRouter();
  return <button type="button" className="btn btn-ghost" onClick={async () => { await fetch("/api/beheer/logout", { method: "POST" }); router.refresh(); }}>Uitloggen</button>;
}
