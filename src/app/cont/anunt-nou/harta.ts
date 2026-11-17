"use server";

import { utilizatorCurent } from "@/lib/auth";
import { adresaLaPunct, gasesteAdresa, gasesteZona } from "@/lib/geocodare";
import { noteaza, permis } from "@/lib/limita";

// Geocodarea din formularul de anunț trece prin serverul nostru (cache + cel mult o cerere pe secundă la
// Nominatim/OpenStreetMap, cu User-Agent CheiaMea). Doar pentru cei logați, cu limită pe cont.
const ORA = 60 * 60_000;
const MAX_PE_ORA = 300;

async function permisCont() {
  const u = await utilizatorCurent();
  if (!u) return false;
  const k = `geocodare:${u.id}`;
  if (!permis(k, MAX_PE_ORA, ORA)) return false;
  noteaza(k);
  return true;
}

/** Centrul cartierului (sau al localității, fără cartier), ca harta din formular să se mute singură acolo. */
export async function gasesteLoc(zona: string, judet: string, oras: string) {
  if (!(await permisCont())) return null;
  return gasesteZona(String(zona).slice(0, 80), String(judet), String(oras));
}

/** Punctul adresei (stradă, număr) din localitatea aleasă. */
export async function gasesteLocAdresa(strada: string, numar: string, judet: string, oras: string) {
  if (!(await permisCont())) return null;
  return gasesteAdresa(String(strada).slice(0, 120), String(numar).slice(0, 20), String(judet), String(oras));
}

/** Strada de la punctul ales pe hartă (completează câmpul „Stradă” dacă e gol). */
export async function stradaLaPunct(lat: number, lng: number) {
  if (!(await permisCont())) return null;
  if (!(lat > 43.5 && lat < 48.4 && lng > 20.2 && lng < 29.8)) return null;
  return adresaLaPunct(Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5);
}
