import Link from "next/link";
import { curataFiltre } from "@/lib/cautari";

/** Butonul „Vezi pe hartă”, cu aceleași filtre ca lista. */
export function LinkHarta({ filtre }: { filtre: Record<string, unknown> }) {
  const qs = new URLSearchParams(curataFiltre(filtre) as Record<string, string>).toString();
  return (
    <Link href={`/harta${qs ? `?${qs}` : ""}`} className="buton secundar buton-harta">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></svg>
      Vezi pe hartă
    </Link>
  );
}
