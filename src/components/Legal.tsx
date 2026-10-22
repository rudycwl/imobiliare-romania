import { ACTUALIZAT } from "@/lib/firma";

export function Legal({ titlu, children }: { titlu: string; children: React.ReactNode }) {
  return (
    <article className="legal">
      <h1>{titlu}</h1>
      <p className="muted small">Ultima actualizare: {ACTUALIZAT}</p>
      {children}
    </article>
  );
}
