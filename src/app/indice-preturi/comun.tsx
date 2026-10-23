import { MIN_ANUNTURI } from "@/lib/indice";

export const nr = (n: number) => new Intl.NumberFormat("ro-RO").format(n);

export function CumCalculam() {
  return (
    <details className="faq">
      <summary>Cum calculăm prețurile?</summary>
      <p>
        Folosim doar anunțurile active de pe CheiaMea și luăm prețul din mijloc (mediana), ca un anunț foarte scump sau foarte ieftin să nu
        strice media. O medie apare doar când sunt cel puțin {MIN_ANUNTURI} anunțuri. Sunt prețuri cerute de vânzători, nu prețuri de
        tranzacție. Cartierul e cel scris în anunț. Cifrele se actualizează în fiecare oră.
      </p>
    </details>
  );
}
