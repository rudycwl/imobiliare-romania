import "server-only";
import { readdir, readFile, stat, writeFile } from "fs/promises";
import { homedir } from "os";
import path from "path";
import { puneInR2, r2Configurat } from "./stocare";

// Pozele noi stau doar pe discul serverului Oracle. Noaptea, cele adăugate de la ultima copie se copiază în R2,
// sub „copie/”, ca să nu se piardă dacă serverul se strică. Pozele șterse de pe site rămân în copie.

const STARE = path.join(homedir(), "copie-poze.json");
const TIPURI: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg" };

async function fisiere(dir: string): Promise<string[]> {
  const intrari = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const r = await Promise.all(intrari.map((e) => (e.isDirectory() ? fisiere(path.join(dir, e.name)) : [path.join(dir, e.name)])));
  return r.flat();
}

export async function copiazaPozele() {
  const dir = process.env.POZE_DIR;
  if (!dir) return { copiate: 0, motiv: "pozele nu stau pe disc (lipsește POZE_DIR)" };
  if (!r2Configurat()) return { copiate: 0, motiv: "lipsesc cheile R2 din /configurare" };
  const start = Date.now();
  const ultima: number = await readFile(STARE, "utf8").then((t) => JSON.parse(t).ultima ?? 0, () => 0);
  let copiate = 0;
  let erori = 0;
  for (const cale of await fisiere(dir)) {
    const tip = TIPURI[path.extname(cale)];
    // O oră de margine: o poză scrisă chiar în timpul copiei de ieri se mai copiază o dată.
    if (!tip || (await stat(cale)).mtimeMs < ultima - 3600_000) continue;
    try {
      await puneInR2(`copie/${path.relative(dir, cale).split(path.sep).join("/")}`, await readFile(cale), tip);
      copiate++;
    } catch (e) {
      erori++;
      console.error("Copie poze:", cale, e);
    }
  }
  // Data se mută înainte doar dacă totul a mers; altfel, data viitoare se reîncearcă.
  if (!erori) await writeFile(STARE, JSON.stringify({ ultima: start, cand: new Date(start).toISOString(), copiate }));
  return { copiate, erori };
}
