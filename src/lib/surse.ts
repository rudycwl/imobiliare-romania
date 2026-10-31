// Regula casei (Rudy, 25.10.2026): legile și impozitele doar din surse oficiale; știrile de piață doar din presa aprobată.
// Folosite de teste și de panoul /admin, ca un link greșit să nu ajungă pe site.

export const OFICIALE = ["legislatie.just.ro", "static.anaf.ro", "monitoruloficial.ro", "mfinante.gov.ro", "primaria-iasi.ro", "primariaclujnapoca.ro", "doc.pmb.ro", "mol.oradea.ro", "ploiesti.ro", "sibiu.ro", "spit-ct.ro", "dfbv.ro", "primariatm.ro", "primariacraiova.ro", "municipiulbacau.ro", "primariapn.ro", "primariaslatina.ro", "pmtgv.ro", "primariacalarasi.ro", "primariabistrita.ro", "miercureaciuc.ro", "primariasv.ro", "tirgumures.ro", "primariagalati.ro", "zalausj.ro", "primariatulcea.ro", "focsani.info", "primariasm.ro", "sfantugheorgheinfo.ro", "primariabraila.ro", "municipiulslobozia.ro", "primariabt.ro", "targujiu.ro", "kezdi.ro"];
export const PRESA = ["agerpres.ro", "g4media.ro", "hotnews.ro", "biziday.ro", "profit.ro", "revistabiz.ro"];

const domeniu = (url: string) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.hostname : "";
  } catch {
    return "";
  }
};
const pe = (url: string, lista: string[]) => {
  const d = domeniu(url);
  return !!d && lista.some((x) => d === x || d.endsWith(`.${x}`));
};

/** Sursă oficială: din listă, un site .gov.ro sau site-ul unei primării (pentru orașe noi adăugate din panou). */
export const oficial = (url: string) => pe(url, OFICIALE) || /(\.gov\.ro|(^|\.)primari[a-z0-9-]*\.ro)$/.test(domeniu(url));
export const presaAprobata = (url: string) => pe(url, PRESA);
