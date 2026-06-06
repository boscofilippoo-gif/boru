import { useEffect, useRef, useState } from "react";

const RUST = "oklch(0.62 0.15 42)";

const mapClamp = (v: number, a: number, b: number, c: number, d: number) => {
  if (b === a) return c;
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return c + t * (d - c);
};

/**
 * UspQuote — card scura (quote) scroll-driven: l'anteprima è la quote SFUMATA in una
 * card leggermente più piccola; scrollando la card cresce a piena dimensione e il testo
 * si mette a fuoco (blur→nitido), poi appare la risposta. Stesso pattern engine del sito.
 */
function UspQuote() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduce(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
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

  // valori derivati (statici se reduce-motion → tutto già rivelato)
  const p = reduce ? 1 : progress;
  // FASE 1 — IRIDE: cerchio dal centro che si espande veloce (0 → 0.25). Parte RUGGINE e vira a nero.
  const veilR = mapClamp(p, 0, 0.25, 0, 75); // raggio % del clip-path circle
  const veilMix = mapClamp(p, 0.12, 0.34, 0, 1); // 0 = ruggine, 1 = nero
  const veilColor = `color-mix(in oklab, oklch(0.62 0.15 42) ${(1 - veilMix) * 100}%, oklch(0.18 0.008 60))`;
  // FASE 2 — la card emerge dal buio (dopo che il cerchio ha coperto lo schermo)
  const sceneOp = mapClamp(p, 0.3, 0.56, 0, 1);
  const sceneY = mapClamp(p, 0.3, 0.58, 50, 0); // px
  const scale = mapClamp(p, 0.3, 0.58, 0.94, 1);
  const quoteBlur = mapClamp(p, 0.36, 0.62, 12, 0);
  // risposta: appare dopo che la quote è a fuoco
  const ansOp = mapClamp(p, 0.66, 0.86, 0, 1);
  const ansBlur = mapClamp(p, 0.66, 0.86, 6, 0);

  return (
    <section
      ref={sectionRef}
      id="usp"
      aria-label="Perché BORU"
      // NB: sezione TRASPARENTE (niente bg-background). Il bianco di base arriva dal body.
      // marginTop negativo: la sezione risale e si sovrappone alla coda della sezione Dati,
      // eliminando la schermata di bianco morto. Essendo trasparente, durante la
      // sovrapposizione l'ultimo dato resta VISIBILE in trasparenza; quando il cerchio (opaco)
      // cresce, lo copre naturalmente. Così il cerchio appare subito dopo l'ultimo dato senza
      // nasconderlo.
      className="relative w-full"
      style={{ height: reduce ? "auto" : "230vh", marginTop: reduce ? undefined : "-110vh" }}
    >
      <div
        className={
          reduce
            ? "relative flex w-full items-center justify-center px-6 py-28"
            : "sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden px-6"
        }
      >
        {/* iride: cerchio nero che si espande dal centro a coprire lo schermo */}
        {!reduce && (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: veilColor,
              clipPath: `circle(${veilR}% at 50% 50%)`,
              willChange: "clip-path",
            }}
          />
        )}

        <div
          className="relative w-full max-w-3xl px-8 py-14 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.6)] md:px-16 md:py-20"
          style={{
            background: "oklch(0.21 0.008 60)",
            borderRadius: "20px",
            opacity: sceneOp,
            transform: `translateY(${sceneY}px) scale(${scale})`,
            willChange: "transform, opacity",
          }}
        >
          {/* tacche d'angolo ruggine */}
          <span className="absolute left-5 top-5 size-7 border-l-2 border-t-2 sm:size-9" style={{ borderColor: RUST }} />
          <span className="absolute right-5 top-5 size-7 border-r-2 border-t-2 sm:size-9" style={{ borderColor: RUST }} />
          <span className="absolute bottom-5 left-5 size-7 border-b-2 border-l-2 sm:size-9" style={{ borderColor: RUST }} />
          <span className="absolute bottom-5 right-5 size-7 border-b-2 border-r-2 sm:size-9" style={{ borderColor: RUST }} />

          {/* virgoletta */}
          <span
            aria-hidden="true"
            className="block select-none font-serif text-7xl leading-none md:text-8xl"
            style={{ color: "oklch(0.62 0.15 42 / 0.35)" }}
          >
            “
          </span>

          {/* quote: sfumata → nitida */}
          <blockquote
            className="-mt-4 max-w-2xl text-balance text-2xl font-light leading-[1.25] tracking-tight text-white md:text-4xl"
            style={{ filter: `blur(${quoteBlur}px)` }}
          >
            Ho già provato software del genere. Non si adatta mai davvero a come lavoriamo noi. Alla
            fine lo abbandoniamo.
          </blockquote>

          {/* risposta: appare dopo */}
          <div style={{ opacity: ansOp, filter: `blur(${ansBlur}px)` }}>
            <span className="my-8 block h-px w-12" style={{ background: RUST }} />
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-white/40">
              BORU studio
            </p>
            <p className="max-w-2xl text-lg leading-relaxed text-white/65">
              Non è un software. È uno studio che entra, capisce, e costruisce su misura. Non impari
              nulla di nuovo. Non cambi nulla di quello che fai già. Vedi i risultati senza sentire
              il cambiamento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export { UspQuote };
