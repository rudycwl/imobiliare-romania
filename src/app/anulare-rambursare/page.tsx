import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { FIRMA } from "@/lib/firma";

export const metadata: Metadata = { title: "Politica de anulare și rambursare", alternates: { canonical: "/anulare-rambursare" } };

export default function AnularePage() {
  return (
    <Legal titlu="Politica de anulare și rambursare">
      <h2>Ce cumperi</h2>
      <p>
        Pe CheiaMea cumperi servicii digitale: promovări pentru anunțuri și abonamente pentru agenții. Nu livrăm produse fizice. Serviciul se activează
        automat, imediat după confirmarea plății de către NETOPIA Payments.
      </p>

      <h2>Dreptul de retragere</h2>
      <p>
        Ca persoană fizică (consumator) ai, în principiu, 14 zile să te retragi dintr-un contract încheiat la distanță (OUG nr. 34/2014). Pentru că
        serviciile noastre încep imediat după plată, la finalizarea comenzii îți ceri expres începerea lor și confirmi că pierzi dreptul de retragere după
        ce serviciul a fost prestat integral (art. 16 lit. a din OUG nr. 34/2014).
      </p>
      <ul>
        <li><strong>Promovările</strong> (reactualizare, Evidențiat, Top în oraș, prima pagină a județului, „Vânzare rapidă”) se consideră prestate în momentul activării, deci nu se rambursează după activare.</li>
        <li><strong>Abonamentele de agenție</strong> sunt pentru firme (relație între profesioniști), deci dreptul de retragere al consumatorului nu se aplică. Le poți opri oricând prin simpla nereînnoire; perioada deja plătită rămâne activă până la final.</li>
      </ul>

      <h2>Când rambursăm</h2>
      <ul>
        <li>Plata a fost încasată, dar serviciul nu s-a activat din cauza unei erori a noastre și nu îl putem activa în 48 de ore.</li>
        <li>Ai fost debitat de două ori pentru aceeași comandă.</li>
        <li>Am șters anunțul promovat din motive care nu țin de încălcarea termenilor de către tine; rambursăm proporțional cu perioada rămasă.</li>
      </ul>
      <p>
        Nu rambursăm promovările sau abonamentele pentru anunțuri șterse pentru încălcarea <a href="/termeni">Termenilor și condițiilor</a>, nici pentru că
        imobilul s-a vândut sau închiriat înainte de sfârșitul promovării.
      </p>

      <h2>Cum ceri o rambursare</h2>
      <p>
        Scrie-ne la <a href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a> cu numărul comenzii sau al facturii și motivul. Răspundem în cel mult 5 zile lucrătoare.
        Rambursarea aprobată se face pe același card cu care ai plătit, prin NETOPIA Payments, de obicei în 5–10 zile lucrătoare, iar pentru suma rambursată
        emitem factură de stornare.
      </p>

      <h2>Anularea unei comenzi neplătite</h2>
      <p>O comandă rămasă neplătită nu te obligă la nimic și se anulează automat. Nu se reține nicio sumă.</p>
    </Legal>
  );
}
