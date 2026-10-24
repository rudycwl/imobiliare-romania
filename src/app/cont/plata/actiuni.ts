"use server";

import { redirect } from "next/navigation";
import { LUNGIME, preaLung } from "@/lib/lungimi";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJudet, getOras } from "@/lib/geo";
import { creeazaComanda, type CerereComanda } from "@/lib/plati/comenzi";
import { netopiaConfigurat, pornestePlata } from "@/lib/plati/netopia";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function platesteActiune(_: { eroare?: string } | undefined, f: FormData) {
  const sesiune = await utilizatorCurent();
  if (!sesiune) redirect("/cont/autentificare");
  if (!netopiaConfigurat()) return { eroare: "Plata cu cardul nu e încă disponibilă." };
  if (!f.get("termeni") || !f.get("incepere")) return { eroare: "Bifează cele două confirmări." };
  let cerere: CerereComanda;
  try {
    cerere = JSON.parse(text(f, "cerere"));
  } catch {
    return { eroare: "Comanda nu e validă." };
  }
  const nume = text(f, "nume");
  const adresa = text(f, "adresa");
  const telefon = text(f, "telefon");
  if (nume.length < 3 || adresa.length < 5 || telefon.length < 6) return { eroare: "Completează numele, adresa și telefonul." };
  const lung = preaLung([["Numele", nume, LUNGIME.nume], ["Adresa", adresa, LUNGIME.adresa], ["Telefonul", telefon, 20], ["Nr. Registrul Comerțului", text(f, "regCom"), LUNGIME.regCom], ["Codul poștal", text(f, "codPostal"), 6]]);
  if (lung) return { eroare: lung };

  const u = await db.utilizator.findUniqueOrThrow({ where: { id: sesiune.id } });
  const firma = u.tip !== "persoana-fizica";
  if (firma && !text(f, "regCom")) return { eroare: "Completează numărul de la Registrul Comerțului." };
  if (cerere.tip === "promovare") {
    const a = await db.anunt.findFirst({ where: { id: Number(cerere.anuntId), proprietarId: u.id, expiraLa: { gt: new Date() } } });
    if (!a) return { eroare: "Anunțul nu e activ." };
  }
  // Adresa și Reg. Com. rămân în cont, pentru factură (obligatorii pe e-Factura).
  await db.utilizator.update({ where: { id: u.id }, data: { adresa, ...(firma && { regCom: text(f, "regCom") }) } });
  const c = await creeazaComanda(u, cerere);
  if (!c) return { eroare: "Comanda nu e validă." };

  const [prenume, ...rest] = nume.split(/\s+/);
  let url: string;
  try {
    const r = await pornestePlata({
      comandaId: c.id,
      descriere: c.descriere,
      sumaBani: c.sumaBani,
      facturare: {
        email: u.email ?? "",
        telefon,
        prenume,
        nume: rest.join(" ") || prenume,
        oras: getOras(u.judet, u.oras)?.nume ?? u.oras,
        judet: getJudet(u.judet)?.nume ?? u.judet,
        codPostal: text(f, "codPostal"),
        adresa,
      },
      produse: [{ nume: c.descriere, cod: c.produs, pretBani: c.sumaBani }],
      notifyUrl: `${SITE}/api/plati/netopia`,
      redirectUrl: `${SITE}/cont/plata/rezultat?comanda=${c.id}`,
    });
    url = r.url;
    if (r.ntpID) await db.comanda.update({ where: { id: c.id }, data: { ntpID: r.ntpID } });
  } catch (e) {
    console.error("NETOPIA start", c.id, e);
    // Motivul de la NETOPIA (cod + mesaj, fără chei) ajută la depanare: jurnalul serverului nu e la îndemână.
    const motiv = (e instanceof Error ? e.message : String(e)).slice(0, 200);
    return { eroare: `Nu am putut deschide pagina de plată. Încearcă din nou peste câteva minute. (${motiv})` };
  }
  redirect(url);
}
