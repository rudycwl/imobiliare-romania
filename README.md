# CheiaMea

CheiaMea (cheiamea.ro): platformă de anunțuri imobiliare din toată țara, organizată modular pe județe și orașe.
Stack: Next.js 15 (App Router) + TypeScript, fără dependențe UI suplimentare (pagini statice / ISR, ~106 kB JS la prima încărcare, PostgreSQL prin Prisma).

## Pornire

Ai nevoie de Node.js 22 și PostgreSQL (local sau găzduit: Neon, Supabase, Vercel Postgres).

```bash
cp .env.example .env    # setează DATABASE_URL
npm install
npm run db:migrate      # creează tabelele
npm run db:seed         # 126 de conturi și 645 de anunțuri demo (re-rulabil)
npm run dev             # http://localhost:3000
```

În producție: `npm run db:deploy` (aplică migrările), apoi `npm run build && npm start`. Build-ul are nevoie de baza de date, pentru că pagina principală și lista de agenții se pre-generează.

## Structură

| Rută | Descriere |
| --- | --- |
| `/` | Căutare, lista celor 42 de județe, anunțuri recente |
| `/[judet]` | Orașele județului + anunțurile județului, cu filtre (ex. `/cluj`) |
| `/[judet]/[oras]` | Anunțurile orașului, cu filtre (ex. `/cluj/cluj-napoca`) |
| `/anunt/[id]` | Pagina anunțului, cu datele vânzătorului |
| `/cautare` | Căutare în toată țara |
| `/agentii`, `/agentii/[slug]` | Agenții imobiliare și profilul fiecăreia |
| `/cont/inregistrare`, `/cont/autentificare` | Conturi: persoană fizică, firmă, agenție imobiliară |
| `/cont`, `/cont/anunt-nou` | Contul meu (anunțurile proprii) și publicarea unui anunț |

- `src/modules/judete/` – câte un fișier per județ, cu lista de orașe. Pentru a adăuga un oraș, editezi fișierul județului; paginile se generează automat.
- `src/modules/types.ts` – modelul de date (`Judet`, `Oras`, `Anunt`, `Utilizator`, `TipUtilizator`).
- `prisma/schema.prisma` – tabelele `Utilizator`, `Anunt`, `Sesiune`; `prisma/seed.ts` + `prisma/demo.ts` – datele demo.
- `src/lib/anunturi.ts`, `src/lib/utilizatori.ts` – interogările (Prisma); `src/lib/auth.ts` – sesiuni.
- `src/app/cont/actiuni.ts` – server actions: înregistrare, autentificare, ieșire, publicare anunț.

### Conturi și securitate

- Parolele se salvează doar ca hash bcrypt.
- Sesiunea e un token aleator în cookie `httpOnly` (30 de zile); în baza de date se păstrează doar hash-ul SHA-256 al token-ului.
- Firmele și agențiile au denumire, CUI și persoană de contact; agențiile au și profil public.

Filtrele (tranzacție, tip, preț, camere, tip vânzător, sortare) sunt parametri în URL, deci orice căutare poate fi partajată.
Paginile de județ, oraș și agenție sunt pre-generate static (SEO + viteză). `sitemap.xml` și `robots.txt` sunt generate automat; setează `NEXT_PUBLIC_SITE_URL` în producție.

## Punere online (Neon + Vercel pentru test, Netlify la lansare)

Planul Hobby de pe Vercel e doar pentru uz necomercial, așa că îl folosim pentru test. La lansare, site-ul rulează pe Netlify (planul gratuit permite uz comercial). Pe Netlify pașii sunt aceiași: imporți repository-ul din GitHub și pui aceleași variabile de mediu. Build-ul e configurat în `netlify.toml`.


1. Creează o bază de date pe [neon.tech](https://neon.tech) (regiunea Frankfurt) și copiază connection string-ul.
2. Importă repository-ul în [Vercel](https://vercel.com/new). La *Environment Variables* adaugă `DATABASE_URL` (de la Neon) și `NEXT_PUBLIC_SITE_URL=https://cheiamea.ro`.
3. Vercel rulează automat `vercel-build` (aplică migrările, apoi build-ul). Date demo, opțional: `DATABASE_URL=... npm run db:seed`.
4. În Vercel → *Domains* adaugă `cheiamea.ro` și `www.cheiamea.ro`, apoi setează la registrar înregistrările DNS afișate de Vercel.

## Facturare (Oblio + e-Factura)

Facturile pentru plățile de pe site (promovări, abonamente agenții) le emite programul de facturare **Oblio**, prin API: el ține seria și numerotarea continuă, trimite PDF-ul pe email clientului și factura în **RO e-Factura (SPV)**. În baza noastră (tabelul `Factura`) păstrăm evidența și legătura cu plata.

- `src/lib/facturare/index.ts` – `emiteFactura({ plataRef, utilizatorId, linii })`, de apelat după ce Netopia confirmă plata. O plată are o singură factură (`plataRef` unic). Mai conține storno, trimitere/verificare SPV și exportul CSV.
- `src/lib/facturare/oblio.ts` – clientul API Oblio.
- `/admin/facturi` – lista pe luni, reemitere, storno, stare e-Factura; `/admin/facturi/export?luna=AAAA-LL` – fișier CSV (Excel) pentru contabil.
- Variabile de mediu: `OBLIO_EMAIL`, `OBLIO_SECRET` (Oblio > Setări > Date cont), `FACTURARE_CIF`, `FACTURARE_SERIE`, `FACTURARE_PLATITOR_TVA` (`da` doar dacă Hugetech e plătitoare de TVA), `FACTURARE_COTA_TVA`. Fără ele, facturile rămân „în așteptare” și se emit din panou după configurare.
- În Oblio: activează *Setări > Preferințe > Trimite automat e-Factura în SPV* și creează seria `CHM`.
- Datele de facturare (CUI, Nr. Reg. Com., adresa) se copiază în factură la emitere; `regCom` și `adresa` sunt câmpuri noi pe `Utilizator`.

## Pașii următori

1. Fotografii la anunțuri (stocare S3 / Vercel Blob) și editare / ștergere anunțuri.
2. Confirmare email și resetare parolă; verificare CUI la ANAF pentru firme și agenții.
3. Paginare, hartă, favorite și alerte de căutare.
4. Deploy (ex. Vercel) pe domeniul final.
