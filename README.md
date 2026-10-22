# Imobiliare România

Platformă de anunțuri imobiliare la nivel național, organizată modular pe județe și orașe.
Stack: Next.js 15 (App Router) + TypeScript, fără dependențe UI suplimentare (pagini statice, ~106 kB JS la prima încărcare).

## Pornire

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

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

- `src/modules/judete/` – câte un fișier per județ, cu lista de orașe. Pentru a adăuga un oraș, editezi fișierul județului; paginile se generează automat.
- `src/modules/types.ts` – modelul de date (`Judet`, `Oras`, `Anunt`, `Utilizator`, `TipUtilizator`).
- `src/lib/anunturi.ts`, `src/lib/utilizatori.ts` – date demo și funcțiile de interogare. Se înlocuiesc cu o bază de date păstrând aceleași semnături.

Filtrele (tranzacție, tip, preț, camere, tip vânzător, sortare) sunt parametri în URL, deci orice căutare poate fi partajată.
Paginile de județ, oraș și agenție sunt pre-generate static (SEO + viteză). `sitemap.xml` și `robots.txt` sunt generate automat; setează `NEXT_PUBLIC_SITE_URL` în producție.

## Pașii următori

1. Bază de date (PostgreSQL) + autentificare reală pentru cele trei tipuri de cont.
2. Formular „Adaugă anunț” cu încărcare de fotografii.
3. Paginare, hartă, favorite și alerte de căutare.
4. Deploy (ex. Vercel) pe domeniul final.
