import { MAX_POZE, pozeAnunt } from "@/lib/poze";
import { stocareConfigurata, urlPublic } from "@/lib/stocare";
import { facePrimaActiune, stergePozaActiune } from "./actiuni";
import { IncarcarePoze } from "./Incarcare";

/** Încărcarea și lista pozelor unui anunț; apare pe pagina de poze și pe pagina de editare. */
export async function SectiunePoze({ anuntId }: { anuntId: number }) {
  const poze = await pozeAnunt(anuntId);
  return (
    <>
      {stocareConfigurata() ? (
        <IncarcarePoze anuntId={anuntId} ramase={MAX_POZE - poze.length} />
      ) : (
        <p className="eroare">Încărcarea pozelor va fi disponibilă în curând.</p>
      )}
      {poze.length > 0 && (
        <ul className="poze-editare">
          {poze.map((p, i) => (
            <li key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- pozele vin direct din stocare, nu prin Netlify */}
              <img src={urlPublic(p.cheie)} alt={`Poza ${i + 1}`} loading="lazy" />
              <form className="butoane-anunt">
                <input type="hidden" name="anunt" value={anuntId} />
                <input type="hidden" name="poza" value={p.id} />
                {i === 0 ? <span className="eticheta-promo">Copertă</span> : <button type="submit" formAction={facePrimaActiune} className="secundar">Fă copertă</button>}
                <button type="submit" formAction={stergePozaActiune} className="secundar">Șterge</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
