import type { statisticiZona } from "@/lib/anunturi";

type Stat = Awaited<ReturnType<typeof statisticiZona>>;
const nr = (n: number) => new Intl.NumberFormat("ro-RO").format(n);

export function intrebariZona(loc: string, s: Stat) {
  return [
    {
      q: `Cât costă un apartament în ${loc}?`,
      a: s.pretMp
        ? `Pe CheiaMea, prețul mediu cerut pentru apartamentele de vânzare în ${loc} este de aproximativ ${nr(s.pretMp)} €/m². Prețul final depinde de zonă, an, etaj și starea locuinței.`
        : `Încă nu avem destule apartamente de vânzare în ${loc} pentru o medie. Revino curând sau setează o căutare.`,
    },
    {
      q: `Cât costă chiria unui apartament în ${loc}?`,
      a: s.chirieMedie
        ? `Chiria medie cerută pentru un apartament în ${loc} este de aproximativ ${nr(s.chirieMedie)} € pe lună, după anunțurile de pe CheiaMea.`
        : `Încă nu avem destule apartamente de închiriat în ${loc} pentru o medie.`,
    },
    {
      q: `Cum public gratuit un anunț imobiliar în ${loc}?`,
      a: `Creezi un cont gratuit pe CheiaMea și apeși „Adaugă anunț”. Dacă ai deja anunțul pe OLX sau Storia, lipești linkul și formularul se completează singur.`,
    },
    {
      q: `Pot căuta doar anunțuri de la proprietari în ${loc}?`,
      a: `Da. La filtrul „Oferit de” alegi „Persoană fizică” și vezi doar anunțurile publicate direct de proprietari, fără agenții.`,
    },
  ];
}

/** Bloc de conținut unic pentru fiecare oraș/județ: cifre reale + întrebări frecvente (cu schema.org FAQPage). */
export function SeoZona({ loc, s, breadcrumb }: { loc: string; s: Stat; breadcrumb: { name: string; url: string }[] }) {
  const faq = intrebariZona(loc, s);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumb.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: b.url })),
    },
  ];
  return (
    <section className="seo-zona">
      <div className="statistici">
        <div><strong>{nr(s.vanzare)}</strong><span>de vânzare</span></div>
        <div><strong>{nr(s.inchiriere)}</strong><span>de închiriat</span></div>
        {s.pretMp && <div><strong>{nr(s.pretMp)} €/m²</strong><span>preț mediu apartamente</span></div>}
        {s.chirieMedie && <div><strong>{nr(s.chirieMedie)} €</strong><span>chirie medie apartament</span></div>}
      </div>
      <h2>Întrebări frecvente despre imobiliare în {loc}</h2>
      {faq.map((f) => (
        <details key={f.q} className="faq">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </section>
  );
}
