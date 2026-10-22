import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Autentificare" };

export default function AutentificarePage() {
  return (
    <div className="ingust">
      <h1>Autentificare</h1>
      <form className="formular">
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Parolă
          <input name="parola" type="password" required autoComplete="current-password" />
        </label>
        <button type="submit" disabled title="Se activează odată cu backend-ul de conturi">
          Intră în cont
        </button>
      </form>
      <p className="muted">
        Nu ai cont? <Link href="/cont/inregistrare">Creează unul gratuit</Link> ca persoană fizică, firmă sau agenție.
      </p>
    </div>
  );
}
