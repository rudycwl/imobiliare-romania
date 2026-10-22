import { JUDETE } from "@/modules/judete";

export { JUDETE };

export function getJudet(slug: string) {
  return JUDETE.find((j) => j.slug === slug);
}

export function getOras(judetSlug: string, orasSlug: string) {
  return getJudet(judetSlug)?.orase.find((o) => o.slug === orasSlug);
}
