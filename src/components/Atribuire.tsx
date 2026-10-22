"use client";

import { useEffect } from "react";

/** Trimite o singură dată pe sesiune sursa vizitei (utm_*, ?ref=, site de proveniență). Fără cookie-uri de la terți. */
export function Atribuire() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cm_v")) return;
      sessionStorage.setItem("cm_v", "1");
    } catch {
      return;
    }
    fetch("/api/vizita", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ search: location.search, referrer: document.referrer, pagina: location.pathname }),
      keepalive: true,
    }).catch(() => {});
  }, []);
  return null;
}
