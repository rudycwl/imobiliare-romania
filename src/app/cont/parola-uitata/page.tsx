import Link from "next/link";
import type { Metadata } from "next";
import { FormularParolaUitata } from "./Formular";

export const metadata: Metadata = { title: "Am uitat parola", robots: { index: false } };

export default function ParolaUitataPage() {
  return (
    <div className="ingust">
      <h1>Am uitat parola</h1>
      <p className="muted">Scrie emailul contului. Îți trimitem un link cu care alegi o parolă nouă.</p>
      <FormularParolaUitata />
      <p className="muted">
        Ți-ai amintit? <Link href="/cont/autentificare">Intră în cont</Link>
      </p>
    </div>
  );
}
