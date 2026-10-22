import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { Distribuie } from "@/components/Distribuie";
import { CadruCont } from "../CadruCont";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export const metadata: Metadata = { title: "Recomandă CheiaMea", robots: { index: false } };

export default async function RecomandaPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const rec = await db.utilizator.findUnique({ where: { id: u.id }, select: { zilePromovare: true, luniBonus: true, _count: { select: { recomandari: true } } } });
  const linkRecomandare = `${SITE}/?ref=${u.slug}`;
  return (
    <CadruCont u={u}>
      <h1>🎁 Recomandă CheiaMea</h1>
      <section className="recomandare">
        <p>
          Trimite linkul tău. La fiecare <strong>3 conturi</strong> create prin el primești <strong>7 zile de promovare gratuită</strong>
          {u.tip === "agentie" && <>, iar pentru fiecare <strong>agenție</strong> adusă, <strong>+1 lună gratuită</strong> (maximum 6)</>}.
        </p>
        <input className="link-recomandare" readOnly value={linkRecomandare} aria-label="Linkul tău de recomandare" />
        <Distribuie url={linkRecomandare} text="Uite CheiaMea, anunțuri imobiliare din toată țara, publicare gratuită pentru proprietari:" />
        <p className="muted small">
          Conturi aduse: {rec?._count.recomandari ?? 0} · Zile de promovare câștigate: {rec?.zilePromovare ?? 0}
          {u.tip === "agentie" && ` · Luni gratuite primite: ${rec?.luniBonus ?? 0} din 6`}
        </p>
      </section>
    </CadruCont>
  );
}
