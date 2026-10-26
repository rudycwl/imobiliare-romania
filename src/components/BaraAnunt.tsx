import Link from "next/link";
import { citesteTexte, linkSigur } from "@/lib/setari";

/** Bara de sus cu un anunț scurt (ex. o ofertă sau o lucrare la site), scrisă din /admin/texte. Fără text nu apare. */
export async function BaraAnunt() {
  const { anuntText, anuntLink } = await citesteTexte();
  if (!anuntText.trim()) return null;
  const link = linkSigur(anuntLink);
  return (
    <div className="bara-anunt" role="note">
      <div className="container">{link ? <Link href={link}>{anuntText}</Link> : anuntText}</div>
    </div>
  );
}
