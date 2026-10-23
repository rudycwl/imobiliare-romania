"use server";

import { utilizatorCurent } from "@/lib/auth";
import { gasesteZona } from "@/lib/geocodare";

/** Centrul cartierului, ca harta din formular să se mute singură acolo. Doar pentru cei logați. */
export async function gasesteLoc(zona: string, judet: string, oras: string) {
  if (!(await utilizatorCurent())) return null;
  return gasesteZona(String(zona).slice(0, 80), String(judet), String(oras));
}
