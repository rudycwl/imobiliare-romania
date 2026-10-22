"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export type StareRetragere = { ok?: { id: string; data: string }; eroare?: string } | undefined;

export async function trimiteRetragere(_: StareRetragere, f: FormData): Promise<StareRetragere> {
  const camp = (k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
  const nume = camp("nume", 120);
  const email = camp("email", 200);
  const comanda = camp("comanda", 60);
  const mesaj = camp("mesaj", 2000) || null;
  if (!nume || !comanda) return { eroare: "Completează numele și numărul comenzii sau al facturii." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { eroare: "Adresa de email nu pare corectă." };
  if (f.get("confirm") !== "da") return { eroare: "Bifează declarația de retragere." };
  const c = await db.cerereRetragere.create({
    data: { id: `RT${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`, nume, email, comanda, mesaj },
  });
  return {
    ok: { id: c.id, data: c.creatLa.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "long", timeStyle: "short" }) },
  };
}
