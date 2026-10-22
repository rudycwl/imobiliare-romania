"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Butoanele de administrare, vizibile doar proprietarului anunțului. */
export function ActiuniProprietar({ id, activ }: { id: number; activ: boolean }) {
  const [proprietar, setProprietar] = useState(false);
  useEffect(() => {
    fetch(`/api/anunt/${id}/proprietar`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { proprietar?: boolean }) => setProprietar(!!j.proprietar))
      .catch(() => {});
  }, [id]);
  if (!proprietar) return null;
  return (
    <div className="actiuni-proprietar">
      <span className="muted small">Anunțul tău:</span>
      <Link href={`/cont/anunt/${id}/editeaza`} className="buton secundar">Editează</Link>
      <Link href={`/cont/anunt/${id}/poze`} className="buton buton-contur-inchis">Poze</Link>
      {activ && <Link href={`/cont/promoveaza/${id}`} className="buton">Promovează</Link>}
    </div>
  );
}
