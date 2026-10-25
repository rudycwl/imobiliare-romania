"use client";

import { useEffect } from "react";

/** Pagina „Ceva n-a mers”: trimite eroarea adminilor și îi lasă vizitatorului butonul „Încearcă din nou”. */
export default function Eroare({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Erorile de pe server (au digest) le-a raportat deja serverul, cu detalii complete.
    if (error.digest) return;
    fetch("/api/eroare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mesaj: error.message || "eroare", unde: location.pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);
  return (
    <div className="ingust">
      <h1>Ceva n-a mers</h1>
      <p>Ne pare rău, pagina nu s-a putut afișa. Am fost anunțați automat și ne uităm.</p>
      <p>
        <button type="button" onClick={reset}>Încearcă din nou</button> <a href="/">sau mergi la prima pagină</a>
      </p>
    </div>
  );
}
