import type { Instrumentation } from "next";

// Next.js apelează onRequestError pentru orice eroare din pagini, acțiuni și rute API: adminii primesc un email.
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
