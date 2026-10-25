"use client";

import { useEffect, useState } from "react";

// Cookie-urile de statistică (cm_sursa, cm_ref) se pun doar după „Accept”. Alegerea stă în cm_cookie (da | nu), 6 luni.
const ALEGERE = "cm_cookie";
const citesteAlegere = () => document.cookie.match(/(?:^|;\s*)cm_cookie=(da|nu)/)?.[1] ?? null;

function trimite(corp: Record<string, unknown>) {
  return fetch("/api/vizita", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corp), keepalive: true }).catch(() => {});
}

/**
 * Numără vizita o dată pe sesiune (fără date personale) și arată bannerul de cookie-uri până la o alegere.
 * Sursa primei vizite (utm_*, ?ref=, site de proveniență) se păstrează în sesiune, ca să ajungă în cookie dacă vizitatorul acceptă mai târziu.
 */
export function Atribuire() {
  const [arata, setArata] = useState(false);
  useEffect(() => {
    const prima = { search: location.search, referrer: document.referrer, pagina: location.pathname };
    try {
      if (!sessionStorage.getItem("cm_prima")) sessionStorage.setItem("cm_prima", JSON.stringify(prima));
      if (!sessionStorage.getItem("cm_v")) {
        sessionStorage.setItem("cm_v", "1");
        trimite(prima);
      }
    } catch {
      /* fără sessionStorage nu numărăm */
    }
    setArata(!citesteAlegere());
    // Linkul „Setări cookie-uri” din subsol redeschide bannerul.
    const redeschide = () => setArata(true);
    window.addEventListener("cm-cookie", redeschide);
    return () => window.removeEventListener("cm-cookie", redeschide);
  }, []);

  function alege(v: "da" | "nu") {
    document.cookie = `${ALEGERE}=${v}; Max-Age=${180 * 24 * 3600}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setArata(false);
    if (v === "da") {
      let prima = {};
      try {
        prima = JSON.parse(sessionStorage.getItem("cm_prima") ?? "{}");
      } catch {}
      trimite({ ...prima, doarCookie: true });
    } else {
      trimite({ stergeCookie: true });
    }
  }

  if (!arata) return null;
  return (
    <div className="banner-cookie" role="dialog" aria-label="Cookie-uri">
      <p>
        Folosim cookie-ul <b>sesiune</b>, necesar ca să rămâi autentificat. Cu acordul tău, mai reținem 30 de zile de unde ai venit pe site și linkul de
        recomandare (pentru statistici și programul de recomandări). Fără publicitate și fără cookie-uri de la terți.{" "}
        <a href="/confidentialitate#cookie-uri">Detalii</a>
      </p>
      <div className="butoane-cookie">
        <button type="button" className="secundar" onClick={() => alege("nu")}>Doar necesare</button>
        <button type="button" onClick={() => alege("da")}>Accept</button>
      </div>
    </div>
  );
}

/** Link în subsol care redeschide bannerul. */
export function SetariCookie() {
  return (
    <button type="button" className="link-buton" onClick={() => window.dispatchEvent(new Event("cm-cookie"))}>
      Setări cookie-uri
    </button>
  );
}
