import { useEffect, useRef, useState } from "react";

const ACCENT_STRONG = "var(--accent-strong)"; // azzurro profondo (etichetta + indicatore su chiaro)
const ACCENT_2 = "var(--accent-2)"; // rosa secondario (watermark di fondo)

const mapClamp = (v: number, a: number, b: number, c: number, d: number) => {
  if (b === a) return c;
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return c + t * (d - c);
};

interface Pillar {
  n: string;
  title: string;
  text: string;
}

interface PillarsCarouselProps {
  pillars: Pillar[];
}

function PillarsCarousel({ pillars }: PillarsCarouselProps) {
  const [reduce, setReduce] = useState(false);
  const [mobile, setMobile] = useState(false);
  // indice del principio mostrato: cambiato manualmente da puntini/frecce/tastiera
  const [active, setActive] = useState(0);
  // ingresso pilotato dallo scroll (watermark → titolo → sottotitolo → micro-blocco)
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduce(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  useEffect(() => {
    const u = () => setMobile(window.innerWidth < 768);
    u();
    window.addEventListener("resize", u);
    return () => window.removeEventListener("resize", u);
  }, []);

  // engine scroll-driven dell'INGRESSO (stesso pattern di text-reveal): 0→1 sulla corsa
  // della sezione mentre lo sticky è pinnato. Pilota SOLO l'ingresso, non la rotazione.
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let lastP = -1;
    const compute = () => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.offsetTop;
      const scrollable = Math.max(el.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max((window.scrollY - top) / scrollable, 0), 1);
      if (Math.abs(p - lastP) > 0.001) {
        lastP = p;
        setProgress(p);
      }
    };
    const onScroll = () => compute();
    const tick = () => {
      compute();
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    compute();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // navigazione: clamp agli estremi (no wrap → evita la rotazione all'indietro di 270°)
  const last = pillars.length - 1;
  const go = (i: number) => setActive(Math.min(Math.max(i, 0), last));

  // frecce ←/→ da tastiera (solo se l'animazione è attiva)
  useEffect(() => {
    if (reduce) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setActive((a) => Math.max(a - 1, 0));
      else if (e.key === "ArrowRight") setActive((a) => Math.min(a + 1, last));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reduce, last]);

  if (reduce) return <PillarsStatic pillars={pillars} />;

  // rotazione pilotata dall'indice attivo: ogni principio è a -90° dal precedente
  const rot = -active * 90;
  // su mobile riduco raggio e prospettiva così le facce ruotate non escono dallo schermo
  // stretto e il titolo resta dentro i bordi (con font più piccolo).
  const radius = mobile ? 260 : 480;
  const perspective = mobile ? 900 : 1300;
  // ancora UNICA del gruppo: titolo e PRINCIPI condividono questo centro; la descrizione
  // sta groupGap rem sotto. Offset in REM → distanza fissa cross-device (niente più vh).
  const groupShift = mobile ? -4 : -5; // rem, quanto il blocco sale dal centro viewport
  const groupGap = mobile ? 6 : 7; // rem, distanza fissa titolo → descrizione

  // ogni faccia è visibile SOLO quando è (quasi) frontale. Titolo E descrizione usano
  // QUESTA stessa visibilità → appaiono/spariscono nello stesso identico istante.
  const faceVis = (i: number) => {
    const ideal = -i * 90;
    const diff = Math.abs(rot - ideal);
    return mapClamp(diff, 10, 42, 1, 0); // piena entro 10°, spenta oltre 42°
  };

  // ── envelope d'INGRESSO pilotate dallo scroll (mapClamp su progress) ──
  // Applicate SOLO a: watermark (fuori 3D), opacità delle FOGLIE (titolo/descrizione,
  // già opacity-driven da faceVis → moltiplico), wrapper controlli (sibling, fuori 3D).
  // MAI su elementi tra perspective e preserve-3d (romperebbero il 3D, com'era successo).
  const reveal = reduce ? 1 : progress;
  const watermarkIn = mapClamp(reveal, 0.0, 0.12, 0.4, 1); // moltiplica il base 0.07
  const titleIn = mapClamp(reveal, 0.1, 0.35, 0, 1); // titolo in dissolvenza
  const subtitleIn = mapClamp(reveal, 0.35, 0.6, 0, 1); // sottotitolo dopo il titolo
  const controlsIn = mapClamp(reveal, 0.6, 0.72, 0, 1); // controlli a composizione completa
  // lieve risalita SOLO per il sottotitolo (la sua ancora è fuori dal contesto 3D)
  const subtitleRise = (1 - subtitleIn) * 1; // rem

  return (
    <section
      ref={sectionRef}
      aria-label="Pilastri"
      className="relative w-full bg-background"
      style={{ height: "200vh" }}
    >
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden px-6">
        {/* parola-fondale in filigrana (FUORI dal contesto 3D): compare per prima.
            opacity = base 0.07 × envelope d'ingresso. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center whitespace-nowrap font-semibold uppercase leading-none tracking-tighter"
          style={{
            fontSize: "26vw",
            color: ACCENT_2,
            opacity: 0.07 * watermarkIn,
            // centrata sullo STESSO punto del titolo (groupShift) → sempre dietro al titolo
            transform: `translateY(${groupShift}rem)`,
          }}
        >
          principi
        </span>

        {/* GRUPPO UNITO: wrapper-ancora con perspective. Lo stage 3D (titolo) è FIGLIO DIRETTO
            (nessun wrapper con transform/opacity in mezzo → 3D intatto). La descrizione (flat)
            è SIBLING dello stage, non discendente del preserve-3d, quindi non ruota. */}
        <div
          className="absolute inset-0"
          style={{ perspective: `${perspective}px`, perspectiveOrigin: "50% 50%" }}
        >
          {/* stage 3D: SOLO il titolo ruota. Centrato sull'ancora (groupShift). */}
          <div
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transform: `translateY(${groupShift}rem) translateZ(-${radius}px) rotateY(${rot}deg)`,
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "transform",
            }}
          >
            {pillars.map((p, i) => (
              <div
                key={p.n}
                className="absolute inset-0 flex items-center justify-center px-6 text-center"
                style={{
                  transform: `rotateY(${i * 90}deg) translateZ(${radius}px)`,
                  // opacità FOGLIA = crossfade carosello × ingresso titolo (3D-safe)
                  opacity: faceVis(i) * titleIn,
                  transition: "opacity 0.6s ease",
                }}
              >
                <h3 className="mx-auto max-w-[90vw] font-title text-balance text-2xl uppercase leading-[1.1] tracking-tight text-foreground sm:text-3xl md:text-5xl">
                  {p.title}
                </h3>
              </div>
            ))}
          </div>

          {/* descrizione FLAT: sibling dello stage (fuori dal preserve-3d → può traslare libera).
              Risalita d'ingresso del sottotitolo applicata qui. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center px-6"
            style={{ transform: `translateY(${groupShift + groupGap + subtitleRise}rem)` }}
          >
            <div className="relative h-[12vh] w-full max-w-xl">
              {pillars.map((p, i) => {
                // opacità FOGLIA = crossfade carosello × ingresso sottotitolo
                const opacity = faceVis(i) * subtitleIn;
                return (
                  <p
                    key={p.n}
                    className="absolute inset-x-0 top-0 mx-auto text-center leading-relaxed text-muted-foreground md:text-lg"
                    style={{ opacity, visibility: opacity <= 0.01 ? "hidden" : "visible", transition: "opacity 0.6s ease" }}
                  >
                    {p.text}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* controlli (sibling, fuori dal 3D): compaiono a composizione completa */}
        <div style={{ opacity: controlsIn, transition: "opacity 0.4s ease", pointerEvents: controlsIn < 0.5 ? "none" : "auto" }}>
          {/* numeri 01–04 cliccabili, stesso stile della scritta "principi": semibold,
              uppercase, tracking stretto, in ROSA. L'attivo è pieno, gli altri tenui. */}
          <div className="absolute bottom-[12vh] left-1/2 flex -translate-x-1/2 items-end gap-5 sm:gap-7">
            {pillars.map((p, i) => (
              <button
                key={p.n}
                type="button"
                onClick={() => go(i)}
                aria-label={`Vai al principio ${i + 1}`}
                aria-current={i === active}
                className="cursor-pointer select-none font-semibold uppercase leading-none tracking-tighter transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{
                  color: ACCENT_2,
                  // l'attivo grande e pieno, gli altri più piccoli e sbiaditi
                  fontSize: i === active ? "2rem" : "1.25rem",
                  opacity: i === active ? 1 : 0.4,
                }}
              >
                {p.n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Fallback statico (mobile + reduce-motion): lista verticale dei pilastri. */
function PillarsStatic({ pillars }: PillarsCarouselProps) {
  return (
    <section
      id="pilastri"
      aria-label="Pilastri"
      className="w-full border-t border-border bg-background px-6 py-28 md:py-40"
    >
      <div className="mx-auto max-w-5xl">
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.18em]" style={{ color: ACCENT_STRONG }}>
          02 — pilastri
        </p>
        <h2 className="max-w-2xl font-title text-balance text-2xl uppercase tracking-tight text-foreground md:text-4xl">
          I principi che guidano ogni lavoro.
        </h2>
        <div className="mt-16 border-t border-border">
          {pillars.map((p) => (
            <div key={p.n} className="border-b border-border py-8">
              <h3 className="mb-3 font-title text-lg uppercase tracking-tight text-foreground md:text-xl">{p.title}</h3>
              <p className="max-w-2xl leading-relaxed text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { PillarsCarousel };
