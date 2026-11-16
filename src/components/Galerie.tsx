"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PozaGalerie = { src: string; alt: string };

/**
 * Galeria pozelor unui anunț/proiect: imaginea mare sus, miniaturile dedesubt.
 * Click pe imaginea mare deschide vizualizarea pe tot ecranul (lightbox),
 * cu săgeți, taste ← → / Esc, swipe pe mobil și contor „3 / 10”.
 */
export function Galerie({ poze, eticheta }: { poze: PozaGalerie[]; eticheta: string }) {
  const [activ, setActiv] = useState(0);
  const [deschis, setDeschis] = useState(false);
  const n = poze.length;
  const mergi = useCallback((d: number) => setActiv((i) => (i + d + n) % n), [n]);
  const randMini = useRef<HTMLDivElement>(null);
  const butonMare = useRef<HTMLButtonElement>(null);
  const butonInchide = useRef<HTMLButtonElement>(null);
  const atingere = useRef<{ x: number; y: number } | null>(null);

  // Miniatura activă rămâne vizibilă în rândul derulabil.
  useEffect(() => {
    const el = randMini.current?.children[activ] as HTMLElement | undefined;
    const rand = randMini.current;
    if (!el || !rand) return;
    const st = el.offsetLeft - rand.offsetLeft;
    if (st < rand.scrollLeft || st + el.offsetWidth > rand.scrollLeft + rand.clientWidth)
      rand.scrollTo({ left: st - (rand.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  }, [activ]);

  // Lightbox: blochează derularea paginii, tastatură, focus pe „Închide”.
  useEffect(() => {
    if (!deschis) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    butonInchide.current?.focus();
    const tasta = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeschis(false);
      else if (e.key === "ArrowLeft") mergi(-1);
      else if (e.key === "ArrowRight") mergi(1);
    };
    window.addEventListener("keydown", tasta);
    const buton = butonMare.current;
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", tasta);
      buton?.focus();
    };
  }, [deschis, mergi]);

  if (!n) return null;
  const p = poze[activ];

  return (
    <div className="galerie" aria-label={eticheta} role="region">
      <button
        ref={butonMare}
        type="button"
        className="galerie-mare"
        onClick={() => setDeschis(true)}
        aria-label={`Deschide poza ${activ + 1} din ${n} pe tot ecranul`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pozele vin direct din stocare, nu prin Netlify */}
        <img src={p.src} alt={p.alt} fetchPriority={activ === 0 ? "high" : undefined} />
        {n > 1 && <span className="galerie-contor" aria-hidden="true">{activ + 1} / {n}</span>}
      </button>
      {n > 1 && (
        <div className="galerie-mini" ref={randMini}>
          {poze.map((m, i) => (
            <button
              key={m.src + i}
              type="button"
              className={i === activ ? "activ" : undefined}
              aria-current={i === activ ? "true" : undefined}
              aria-label={`Arată poza ${i + 1} din ${n}`}
              onClick={() => setActiv(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- pozele vin direct din stocare */}
              <img src={m.src} alt={m.alt} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
      {deschis && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${eticheta}: poza ${activ + 1} din ${n}`}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("lightbox-scena")) setDeschis(false);
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            atingere.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={(e) => {
            const s = atingere.current;
            atingere.current = null;
            if (!s || n < 2) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - s.x;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(t.clientY - s.y)) mergi(dx < 0 ? 1 : -1);
          }}
        >
          <div className="lightbox-sus">
            <span className="lightbox-contor" aria-live="polite">{activ + 1} / {n}</span>
            <button ref={butonInchide} type="button" className="lightbox-inchide" onClick={() => setDeschis(false)} aria-label="Închide">
              ×
            </button>
          </div>
          <div className="lightbox-scena">
            {/* eslint-disable-next-line @next/next/no-img-element -- pozele vin direct din stocare */}
            <img src={p.src} alt={p.alt} />
          </div>
          {n > 1 && (
            <>
              <button type="button" className="lightbox-sageata stanga" onClick={() => mergi(-1)} aria-label="Poza anterioară">
                ‹
              </button>
              <button type="button" className="lightbox-sageata dreapta" onClick={() => mergi(1)} aria-label="Poza următoare">
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
