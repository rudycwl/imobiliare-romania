import type { Instrumentation } from "next";

// La pornire: șterge plățile de test rămase (vezi src/lib/curatare-teste.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { curataPlatiTest } = await import("./lib/curatare-teste");
  await curataPlatiTest();
  // Starea e-Factura se citește doar din Oblio (nu se trimite nimic), ca /admin/facturi să nu rămână pe „în prelucrare”.
  const { actualizeazaStariEFactura } = await import("./lib/facturare");
  void actualizeazaStariEFactura().catch((e) => console.error("Starea e-Factura:", e));
  // Anunțurile fără loc pe hartă (vechi, importate din OLX/Storia, din API sau feed) primesc unul aproximativ:
  // strada → zona → centrul localității. În fundal, la ≤ 1 cerere/secundă spre Nominatim; doar cele cu lat = null.
  const { completeazaCoordonate } = await import("./lib/geocodare");
  void completeazaCoordonate(Number.MAX_SAFE_INTEGER, { toate: true })
    .then((r) => r.completate + r.esuate > 0 && console.log(`Coordonate completate: ${r.completate}, negăsite: ${r.esuate}`))
    .catch((e) => console.error("Coordonate:", e));
}

// Next.js apelează onRequestError pentru orice eroare din pagini, acțiuni și rute API: eroarea se păstrează pentru ERP (/api/erp/erori).
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const e = err instanceof Error ? err : new Error(String(err));
  const { raporteazaEroare } = await import("./lib/raport-erori");
  await raporteazaEroare({
    sursa: "server",
    mesaj: e.message.trim() || "eroare fără mesaj",
    unde: request.path,
    detalii: [`${request.method} ${request.path}`, `tip: ${context.routeType}, ruta: ${context.routePath}`, (e.stack ?? "").split("\n").slice(0, 8).join("\n")].join("\n"),
  });
};
