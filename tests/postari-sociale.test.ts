import { test } from "node:test";
import assert from "node:assert/strict";

// Rudy 17.11.2026: „când postez un anunț pe rețele, clientul trebuie anunțat automat” și „fiecare client are dreptul să știe,
// să vadă”. Testele cu bază de date rulează doar cu TEST_DATABASE_URL (bază PostgreSQL de test, cu migrările aplicate).
// Transportul de e-mail (API-ul Brevo, apelat cu fetch) e simulat: nu pleacă niciun e-mail.

const CHEIE = "cheie-test-postari-1234567890";
process.env.ALERTE_CHEIE = CHEIE;
process.env.BREVO_API_KEY = "test-simulat";
process.env.NEXT_PUBLIC_SITE_URL = "https://cheiamea.ro";
const BAZA = process.env.TEST_DATABASE_URL;
if (BAZA) process.env.DATABASE_URL = BAZA;

// E-mailurile „trimise”: fetch către api.brevo.com e interceptat; `cadeBrevo` simulează o pană a serviciului.
const trimise: { to: string; subject: string; text: string }[] = [];
let cadeBrevo = false;
const fetchOriginal = globalThis.fetch;
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname === "api.brevo.com") {
    if (cadeBrevo) return new Response("indisponibil", { status: 503 });
    const corp = JSON.parse(String(init?.body));
    trimise.push({ to: corp.to[0].email, subject: corp.subject, text: corp.textContent });
    return new Response(JSON.stringify({ messageId: "simulat" }), { status: 201 });
  }
  return fetchOriginal(input, init);
}) as typeof fetch;

// Importate după ce mediul și fetch-ul simulat sunt pregătite.
const ruta = () => import("../src/app/api/postari-sociale/route");
const lib = () => import("@/lib/postari-sociale");

const cerere = (corp: unknown, cheie?: string) =>
  new Request("https://cheiamea.ro/api/postari-sociale", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cheie ? { "x-cheie": cheie } : {}) },
    body: JSON.stringify(corp),
  });

const IG = "https://www.instagram.com/p/Df2E1NvoT4O/";

test("autorizare: fără cheie, cu cheie greșită sau de altă lungime → 401 (și GET)", async () => {
  const { POST, GET } = await ruta();
  assert.equal((await POST(cerere({ anuntId: 5, retea: "instagram", url: IG }))).status, 401);
  assert.equal((await POST(cerere({ anuntId: 5, retea: "instagram", url: IG }, "cheie-test-postari-0000000000"))).status, 401);
  assert.equal((await POST(cerere({ anuntId: 5, retea: "instagram", url: IG }, "x"))).status, 401);
  assert.equal((await GET(new Request("https://cheiamea.ro/api/postari-sociale?anuntId=5"))).status, 401);
  assert.equal(trimise.length, 0);
});

test("cererea: rețea cunoscută, link https chiar al rețelei, curățat de parametrii de urmărire", async () => {
  const { POST } = await ruta();
  const { citesteCerere, normalizeazaUrl } = await lib();
  assert.equal(normalizeazaUrl("instagram", IG), "https://www.instagram.com/p/Df2E1NvoT4O");
  assert.equal(normalizeazaUrl("instagram", "https://www.instagram.com/p/Df2E1NvoT4O/?igsh=abc123#x"), "https://www.instagram.com/p/Df2E1NvoT4O");
  assert.equal(normalizeazaUrl("instagram", "https://instagram.com.rau.ro/p/x"), null);
  assert.equal(normalizeazaUrl("instagram", "http://www.instagram.com/p/x"), null);
  assert.equal(normalizeazaUrl("instagram", "https://www.instagram.com/"), null);
  assert.equal(normalizeazaUrl("facebook", "https://www.facebook.com/permalink.php?story_fbid=1&id=2&mibextid=z"), "https://www.facebook.com/permalink.php?story_fbid=1&id=2");
  assert.equal(normalizeazaUrl("facebook", IG), null);
  assert.deepEqual(citesteCerere({ anuntId: "5", retea: "Instagram", url: IG }), { anuntId: 5, retea: "instagram", url: "https://www.instagram.com/p/Df2E1NvoT4O" });
  assert.ok("eroare" in citesteCerere({ anuntId: 0, retea: "instagram", url: IG }));
  assert.ok("eroare" in citesteCerere({ anuntId: 5, retea: "myspace", url: IG }));
  assert.ok("eroare" in citesteCerere(null));
  // Cu cheia bună, o cerere greșită primește 400 înainte de orice acces la bază
  assert.equal((await POST(cerere({ anuntId: 5, retea: "myspace", url: IG }, CHEIE))).status, 400);
});

test("textul e-mailului: politicos, cu „dumneavoastră”, linkul postării și al anunțului", async () => {
  const { emailPostare } = await lib();
  const e = emailPostare({ id: 5, titlu: "Apartament 2 camere Copou" }, "instagram", "https://www.instagram.com/p/Df2E1NvoT4O");
  assert.equal(e.subiect, "Anunțul dumneavoastră a fost promovat pe Instagram");
  assert.ok(
    e.paragrafe.includes(
      "Am promovat anunțul dumneavoastră „Apartament 2 camere Copou” pe Instagram: https://www.instagram.com/p/Df2E1NvoT4O. Anunțul complet: https://cheiamea.ro/anunt/5",
    ),
  );
});

const cuBaza = { skip: BAZA ? false : "fără TEST_DATABASE_URL" };

test("cu bază: înregistrare → e-mail o singură dată; reînregistrarea aceluiași link nu retrimite; altă rețea = alt e-mail", cuBaza, async () => {
  const { POST, GET } = await ruta();
  const { db } = await import("@/lib/db");
  const sufix = Math.random().toString(36).slice(2, 8);
  const u = await db.utilizator.create({
    data: { slug: `test-postari-${sufix}`, tip: "persoana", nume: "Eugen Test", email: `eugen-${sufix}@test.local`, telefon: "0700000000", judet: "iasi", oras: "iasi" },
  });
  const a = await db.anunt.create({
    data: { titlu: "Apartament 2 camere Copou", descriere: "Test", tip: "apartament", tranzactie: "vanzare", pret: 90000, suprafata: 50, judet: "iasi", oras: "iasi", zona: "Copou", imagine: "#64748b", proprietarId: u.id },
  });
  trimise.length = 0;
  try {
    // 1. Prima înregistrare: 201, e-mail trimis proprietarului
    let r = await POST(cerere({ anuntId: a.id, retea: "instagram", url: IG }, CHEIE));
    let j = await r.json();
    assert.equal(r.status, 201);
    assert.equal(j.email, "trimis");
    assert.equal(j.postare.url, "https://www.instagram.com/p/Df2E1NvoT4O");
    assert.equal(trimise.length, 1);
    assert.equal(trimise[0].to, u.email);
    assert.equal(trimise[0].subject, "Anunțul dumneavoastră a fost promovat pe Instagram");
    assert.match(trimise[0].text, new RegExp(`Am promovat anunțul dumneavoastră „Apartament 2 camere Copou” pe Instagram: https://www\\.instagram\\.com/p/Df2E1NvoT4O\\. Anunțul complet: https://cheiamea\\.ro/anunt/${a.id}`));
    assert.match(trimise[0].text, /Echipa CheiaMea/);

    // 2. Același link (și cu parametri de urmărire): 200, fără dublură, fără al doilea e-mail
    r = await POST(cerere({ anuntId: a.id, retea: "instagram", url: IG }, CHEIE));
    j = await r.json();
    assert.equal(r.status, 200);
    assert.equal(j.email, "deja-trimis");
    r = await POST(cerere({ anuntId: a.id, retea: "instagram", url: IG + "?igsh=MWx0abc" }, CHEIE));
    assert.equal(r.status, 200);
    assert.equal(trimise.length, 1);
    assert.equal(await db.postareSociala.count({ where: { anuntId: a.id } }), 1);

    // 3. Două cereri simultane pentru o postare nouă: un singur e-mail
    const FB = "https://www.facebook.com/cheiamea/posts/123456";
    const [r1, r2] = await Promise.all([
      POST(cerere({ anuntId: a.id, retea: "facebook", url: FB }, CHEIE)),
      POST(cerere({ anuntId: a.id, retea: "facebook", url: FB }, CHEIE)),
    ]);
    assert.deepEqual([r1.status, r2.status].sort(), [200, 201]);
    assert.equal(trimise.length, 2);
    assert.match(trimise[1].subject, /Facebook/);

    // 4. Serviciul de e-mail cade: postarea rămâne, e-mailul se trimite la reînregistrare (tot o singură dată)
    cadeBrevo = true;
    const TT = "https://www.tiktok.com/@cheiamea/video/7300000000000000000";
    r = await POST(cerere({ anuntId: a.id, retea: "tiktok", url: TT }, CHEIE));
    j = await r.json();
    assert.equal(r.status, 201);
    assert.equal(j.email, "netrimis");
    assert.equal(trimise.length, 2);
    cadeBrevo = false;
    r = await POST(cerere({ anuntId: a.id, retea: "tiktok", url: TT }, CHEIE));
    assert.equal((await r.json()).email, "trimis");
    r = await POST(cerere({ anuntId: a.id, retea: "tiktok", url: TT }, CHEIE));
    assert.equal((await r.json()).email, "deja-trimis");
    assert.equal(trimise.length, 3);

    // 5. GET cu cheie: lista postărilor
    const g = await GET(new Request(`https://cheiamea.ro/api/postari-sociale?anuntId=${a.id}`, { headers: { "x-cheie": CHEIE } }));
    assert.equal((await g.json()).postari.length, 3);

    // 6. Anunț inexistent: 404, nimic trimis
    r = await POST(cerere({ anuntId: 999999999, retea: "instagram", url: IG }, CHEIE));
    assert.equal(r.status, 404);
    assert.equal(trimise.length, 3);
  } finally {
    await db.utilizator.delete({ where: { id: u.id } });
    await db.$disconnect();
  }
});
