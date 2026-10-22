import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>Pagina nu a fost găsită</h1>
      <p><Link href="/">Înapoi la pagina principală</Link></p>
    </>
  );
}
