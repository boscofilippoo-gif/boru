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
  const sectionRef = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);
  const [mobile, setMobile] = useState(false);
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

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let last = -1;
    const compute = () => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.offsetTop;
      const scrollable = Math.max(el.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max((window.scrollY - top) / scrollable, 0), 1);
      if (Math.abs(p - last) > 0.001) {
        last = p;
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

  if (reduce) return <PillarsStatic pillars={pillars} />;

  // rotazione 3D a gradini: il primo titolo gira quasi subito (poca attesa iniziale),
  // poi ruota → breve pausa → ruota. ogni segmento aggiunge -90° (parte da 0 → si somma bene).
  const rot =
    mapClamp(progress, 0.12, 0.26, 0, -90) +
    mapClamp(progress, 0.42, 0.56, 0, -90) +
    mapClamp(progress, 0.72, 0.86, 0, -90);

  const active = Math.min(Math.round(progress * 3), 3);
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

  return (
    <section
      ref={sectionRef}
      aria-label="Pilastri"
      className="relative w-full bg-background"
      style={{ height: mobile ? "190vh" : "300vh" }}
    >
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden px-6">
        {/* parola-fondale in filigrana: contesto della sezione, ferma dietro al carosello */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center whitespace-nowrap font-semibold uppercase leading-none tracking-tighter"
          style={{
            fontSize: "26vw",
            color: ACCENT_2,
            opacity: 0.07,
            // centrata sullo STESSO punto del titolo (groupShift) → sempre dietro al titolo,
            // identico desktop/mobile, senza offset vh device-dipendenti
            transform: `translateY(${groupShift}rem)`,
          }}
        >
          principi
        </span>

        {/* GRUPPO UNITO: wrapper-ancora con perspective. La stage 3D (titolo) e la descrizione
            (flat) sono SIBLING qui dentro → condividono lo stesso centro, ma la descrizione NON
            è discendente del preserve-3d quindi non ruota. */}
        <div
          className="absolute inset-0"
          style={{ perspective: `${perspective}px`, perspectiveOrigin: "50% 50%" }}
        >
          {/* stage 3D: SOLO il titolo ruota. Centrata sull'ancora (groupShift). */}
          <div
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transform: `translateY(${groupShift}rem) translateZ(-${radius}px) rotateY(${rot}deg)`,
              willChange: "transform",
            }}
          >
            {pillars.map((p, i) => (
              <div
                key={p.n}
                className="absolute inset-0 flex items-center justify-center px-6 text-center"
                style={{
                  transform: `rotateY(${i * 90}deg) translateZ(${radius}px)`,
                  opacity: faceVis(i),
                }}
              >
                <h3 className="mx-auto max-w-[90vw] text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-6xl">
                  {p.title}
                </h3>
              </div>
            ))}
          </div>

          {/* descrizione FLAT: sibling della stage (NON nel preserve-3d). Ancorata al centro
              (top-1/2) e spinta sotto il titolo di groupShift+groupGap rem → gap titolo↔descrizione
              FISSO in rem, identico su ogni schermo. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center px-6"
            style={{ transform: `translateY(${groupShift + groupGap}rem)` }}
          >
            <div className="relative h-[12vh] w-full max-w-xl">
              {pillars.map((p, i) => {
                const opacity = faceVis(i);
                return (
                  <p
                    key={p.n}
                    className="absolute inset-x-0 top-0 mx-auto text-center leading-relaxed text-muted-foreground md:text-lg"
                    style={{ opacity, visibility: opacity <= 0.01 ? "hidden" : "visible" }}
                  >
                    {p.text}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 puntini (paritari, non numerati) */}
        <div className="absolute bottom-[14vh] flex items-center gap-2.5">
          {pillars.map((p, i) => (
            <span
              key={p.n}
              className="size-2 rounded-full transition-colors duration-300"
              style={{ background: i === active ? ACCENT_STRONG : "oklch(0.82 0.01 80)" }}
            />
          ))}
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
        <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
          I principi che guidano ogni lavoro.
        </h2>
        <div className="mt-16 border-t border-border">
          {pillars.map((p) => (
            <div key={p.n} className="border-b border-border py-8">
              <h3 className="mb-3 text-xl font-semibold text-foreground md:text-2xl">{p.title}</h3>
              <p className="max-w-2xl leading-relaxed text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { PillarsCarousel };
