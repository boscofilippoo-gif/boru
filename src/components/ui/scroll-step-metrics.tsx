import { useEffect, useRef, useState } from "react";

// etichetta mono su fondo chiaro: azzurro "profondo" per contrasto leggibile
const ACCENT = "var(--accent-strong)";

// helper: mappa v dall'intervallo [a,b] a [c,d], con clamp
const mapClamp = (v: number, a: number, b: number, c: number, d: number) => {
  if (b === a) return c;
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return c + t * (d - c);
};

const METRICS = [
  { value: "12h", label: "ore a settimana recuperate per team" },
  { value: "3x", label: "velocità media sui flussi automatizzati" },
  { value: "€0", label: "speso in nuovi software dal cliente" },
  { value: "100%", label: "costruito sui tuoi strumenti attuali" },
];

// finestre di transizione per i 4 step: [entraA, entraB, esceA, esceB]
// 4 numeri distribuiti UNIFORMEMENTE sulla corsa (≈0.5vh per evento, in linea con le altre
// sezioni scroll-driven). Ogni numero è visibile ~1/4 della corsa, con crossfade dolce.
const WINDOWS: Array<[number, number, number, number]> = [
  [-1, -1, 0.22, 0.3], // step 0: già visibile, esce verso 1/4
  [0.24, 0.32, 0.48, 0.56],
  [0.5, 0.58, 0.72, 0.8],
  [0.74, 0.82, 2, 2], // step 3: entra a ~3/4, resta pieno fino a fine corsa
];

function ScrollStepMetrics() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobile, setMobile] = useState(false);

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

  if (reduce) return <StaticMetrics />;

  const Header = (
    <div className="absolute top-[12vh] left-0 right-0 px-6 text-center">
      <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        Misuriamo prima di promettere.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Valori indicativi medi sui processi che analizziamo. I tuoi numeri li calcoliamo insieme,
        sul tuo processo reale, durante la call di analisi.
      </p>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Dati"
      className="relative w-full bg-background"
      style={{ height: mobile ? "190vh" : "300vh" }}
    >
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden px-6">
        {Header}

        {/* numeri sovrapposti, uno attivo alla volta */}
        <div className="relative flex h-[40vh] w-full items-center justify-center">
          {METRICS.map((m, i) => {
            const [eA, eB, xA, xB] = WINDOWS[i];
            const enter = eA < 0 ? 1 : mapClamp(progress, eA, eB, 0, 1);
            const leave = xB > 1 ? 1 : mapClamp(progress, xA, xB, 1, 0);
            const opacity = enter * leave;
            const yIn = eA < 0 ? 0 : mapClamp(progress, eA, eB + 0.02, 40, 0);
            const yOut = xB > 1 ? 0 : mapClamp(progress, xA, xB + 0.02, 0, -40);
            const y = yIn + yOut;
            return (
              <div
                key={m.value}
                className="pointer-events-none absolute flex flex-col items-center text-center"
                style={{ opacity, transform: `translateY(${y}px)`, visibility: opacity <= 0.01 ? "hidden" : "visible" }}
              >
                <span className="font-mono text-6xl font-medium tracking-tighter text-foreground md:text-9xl">
                  {m.value}
                </span>
                <span className="mt-5 max-w-[26ch] text-base text-muted-foreground md:text-lg">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* indice + barra di avanzamento */}
      </div>
    </section>
  );
}

/** Variante statica per prefers-reduced-motion: i 4 numeri in griglia, niente scroll. */
function StaticMetrics() {
  return (
    <section aria-label="Dati" className="w-full border-t border-border bg-background px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
          03 — dati
        </p>
        <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Misuriamo prima di promettere.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Valori indicativi medi sui processi che analizziamo. I tuoi numeri li calcoliamo insieme,
          sul tuo processo reale, durante la call di analisi.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.value} className="bg-background p-8">
              <span className="block font-mono text-5xl font-medium tracking-tight text-foreground">
                {m.value}
              </span>
              <span className="mt-4 block max-w-[22ch] text-sm leading-relaxed text-muted-foreground">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { ScrollStepMetrics };
