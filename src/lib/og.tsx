import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Imaginea de previzualizare (Facebook, WhatsApp etc.), în culorile CheiaMea. */
export function imagineOg({ titlu, subtitlu, eticheta }: { titlu: string; subtitlu?: string; eticheta?: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(120deg, #0b2545 0%, #1d4e89 70%, #f97316 100%)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 80 80">
            <rect width="80" height="80" rx="20" fill="#fff" />
            <path d="M40 16 L64 36 V64 H16 V36 Z" fill="#F97316" />
            <circle cx="40" cy="42" r="7" fill="#0B2545" />
            <path d="M36.5 45 h7 l2.5 12 h-12 z" fill="#0B2545" />
          </svg>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>
            Cheia<span style={{ color: "#fdba74" }}>Mea</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {eticheta && <div style={{ display: "flex", alignSelf: "flex-start", background: "#f97316", padding: "8px 18px", borderRadius: 999, fontSize: 28, fontWeight: 700 }}>{eticheta}</div>}
          <div style={{ display: "flex", fontSize: titlu.length > 60 ? 52 : 64, fontWeight: 800, lineHeight: 1.1 }}>{titlu}</div>
          {subtitlu && <div style={{ display: "flex", fontSize: 32, opacity: 0.9 }}>{subtitlu}</div>}
        </div>
        <div style={{ display: "flex", fontSize: 26, opacity: 0.8 }}>cheiamea.ro · anunțuri imobiliare din toată țara</div>
      </div>
    ),
    OG_SIZE,
  );
}
