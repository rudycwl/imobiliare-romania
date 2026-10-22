import { TIPURI, TIPURI_UTILIZATOR, TRANZACTII } from "./etichete";
import { getJudet, getOras } from "./geo";

/** Filtrele care se păstrează într-o căutare salvată (sortarea nu contează). */
const CHEI = ["judet", "oras", "tip", "tranzactie", "pretMin", "pretMax", "camere", "oferit", "q"] as const;
export type FiltreSalvate = Partial<Record<(typeof CHEI)[number], string>>;

export function curataFiltre(f: Record<string, unknown>): FiltreSalvate {
  const r: FiltreSalvate = {};
  for (const k of CHEI) {
    const v = typeof f[k] === "string" ? (f[k] as string).trim().slice(0, 80) : "";
    if (v) r[k] = v;
  }
  if (r.judet && !getJudet(r.judet)) delete r.judet;
  if (r.oras && !(r.judet && getOras(r.judet, r.oras))) delete r.oras;
  return r;
}

const nr = (v: string) => new Intl.NumberFormat("ro-RO").format(Number(v));

/** Ex. „Apartament · Vânzare · Iași, Iași · minim 2 camere · până la 90.000 €”. */
export function descriereCautare(f: FiltreSalvate) {
  const loc = f.oras && f.judet ? `${getOras(f.judet, f.oras)?.nume}, ${getJudet(f.judet)?.nume}` : f.judet ? `județul ${getJudet(f.judet)?.nume}` : "toată țara";
  const pret = f.pretMin && f.pretMax ? `${nr(f.pretMin)}–${nr(f.pretMax)} €` : f.pretMin ? `de la ${nr(f.pretMin)} €` : f.pretMax ? `până la ${nr(f.pretMax)} €` : "";
  return [
    TIPURI[f.tip as keyof typeof TIPURI] ?? "Orice proprietate",
    TRANZACTII[f.tranzactie as keyof typeof TRANZACTII],
    loc,
    f.camere && (f.camere === "1" ? "minim 1 cameră" : `minim ${f.camere} camere`),
    pret,
    f.oferit && TIPURI_UTILIZATOR[f.oferit as keyof typeof TIPURI_UTILIZATOR],
    f.q && `„${f.q}”`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Pagina pe care se vede căutarea: a orașului, a județului sau căutarea generală. */
export function linkCautare(f: FiltreSalvate) {
  const { judet, oras, ...rest } = f;
  const q = new URLSearchParams(rest as Record<string, string>).toString();
  const cale = judet && oras ? `/${judet}/${oras}` : judet ? `/${judet}` : "/cautare";
  return q ? `${cale}?${q}` : cale;
}
