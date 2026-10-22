/** Butoane de distribuire: linkuri simple, fără scripturi de la terți (site rapid, fără cookie-uri de urmărire). */
export function Distribuie({ url, text }: { url: string; text: string }) {
  const u = encodeURIComponent(url);
  return (
    <div className="distribuie">
      <span className="muted small">Trimite și altora:</span>
      <a className="share share-wa" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <a className="share share-fb" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
    </div>
  );
}
