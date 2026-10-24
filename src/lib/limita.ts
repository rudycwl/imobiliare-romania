import "server-only";
import { headers } from "next/headers";

// Limite simple contra încercărilor repetate (ghicirea parolei, conturi create pe bandă).
// Site-ul rulează într-un singur proces pe serverul Oracle, deci ținem evidența în memorie.

const g = globalThis as unknown as { __limite?: Map<string, number[]> };
const evidenta: Map<string, number[]> = (g.__limite ??= new Map());

/** Adresa vizitatorului: Caddy o pune ultima în X-Forwarded-For (ce trimite browserul în față nu contează). */
export async function ipClient() {
  const xff = (await headers()).get("x-forwarded-for") ?? "";
  return xff.split(",").pop()?.trim() || "necunoscut";
}

function recente(cheie: string, fereastraMs: number) {
  const prag = Date.now() - fereastraMs;
  const t = (evidenta.get(cheie) ?? []).filter((x) => x > prag);
  if (t.length) evidenta.set(cheie, t);
  else evidenta.delete(cheie);
  return t;
}

/** true dacă mai sunt încercări permise pentru cheie în fereastra dată. */
export const permis = (cheie: string, max: number, fereastraMs: number) => recente(cheie, fereastraMs).length < max;

export function noteaza(cheie: string) {
  evidenta.set(cheie, [...(evidenta.get(cheie) ?? []), Date.now()]);
  // Curățenie ocazională, ca harta să nu crească la nesfârșit.
  if (evidenta.size > 20_000) for (const k of evidenta.keys()) recente(k, 24 * 3600_000);
}

export const sterge = (cheie: string) => evidenta.delete(cheie);
