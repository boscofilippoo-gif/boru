import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const mapClamp = (v: number, a: number, b: number, c: number, d: number) => {
  if (b === a) return c;
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return c + t * (d - c);
};

interface RevealSegment {
  text: string;
  /** colore "acceso" della parola (es. "var(--foreground)" o l'accento ruggine) */
  litColor: string;
}

interface TextRevealProps {
  segments: RevealSegment[];
  /** colore delle parole "spente" (grigio); accendendosi virano al loro litColor */
  dimColor?: string;
  /** altezza della scena in vh (governa quanto scroll serve per accendere tutta la frase) */
  heightVh?: number;
  /** altezza in vh sotto i 768px; se assente usa heightVh. Serve a ridurre la coda su mobile */
  heightVhMobile?: number;
  /** altezza della banda sticky visibile in vh (più bassa = meno spazio vuoto sopra/sotto) */
  stickyVh?: number;
  className?: string;
}

/**
 * TextReveal — la frase si "accende" parola per parola legata allo scroll.
 * Engine scroll-driven coerente col resto del progetto (offsetTop + scrollY + rAF + mapClamp),
 * niente framer-motion. Rispetta prefers-reduced-motion (frase già accesa, ferma).
 */
function TextReveal({
  segments,
  dimColor = "oklch(0.74 0.008 80)",
  heightVh = 150,
  heightVhMobile,
  stickyVh = 100,
  className,
}: TextRevealProps) {
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

  // altezza effettiva: su mobile usa heightVhMobile se fornito (coda più corta)
  const effHeightVh = mobile && heightVhMobile != null ? heightVhMobile : heightVh;

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let last = -1;
    const compute = () => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.offsetTop;
      const stickyPx = window.innerHeight * (stickyVh / 100);
      const scrollable = Math.max(el.offsetHeight - stickyPx, 1);
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
  }, [reduce, stickyVh]);

  // appiattisco i segmenti in un array globale di parole con il loro colore acceso
  const words = segments.flatMap((seg) =>
    seg.text.split(/\s+/).filter(Boolean).map((w) => ({ word: w, litColor: seg.litColor })),
  );
  const N = words.length;

  const phraseClass = cn(
    "flex max-w-4xl flex-wrap text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-5xl",
    className,
  );

  // ogni parola: copia grigia di base + copia colorata sopra con opacity (0→1).
  // Accendendosi, il colore "arriva" fondendosi sul grigio.
  const Word = ({ word, litColor, lit }: { word: string; litColor: string; lit: number }) => (
    <span className="relative mr-[0.25em] inline-block">
      <span style={{ color: dimColor }}>{word}</span>
      <span className="absolute inset-0" style={{ color: litColor, opacity: lit }} aria-hidden="true">
        {word}
      </span>
    </span>
  );

  // ── reduced-motion: frase già accesa (colori pieni), ferma, niente sticky ──
  if (reduce) {
    return (
      <div className="flex w-full justify-center px-6 py-20">
        <p className={phraseClass}>
          {words.map((w, i) => (
            <Word key={i} word={w.word} litColor={w.litColor} lit={1} />
          ))}
        </p>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="relative w-full" style={{ height: `${effHeightVh}vh` }}>
      <div
        className="sticky flex w-full items-center justify-center px-6"
        // banda alta stickyVh ma CENTRATA nel viewport (offset = metà dello spazio residuo)
        // → il testo cade al 50% dell'altezza schermo, non al centro di una banda ancorata in alto
        style={{ height: `${stickyVh}vh`, top: `${(100 - stickyVh) / 2}vh` }}
      >
        <p className={phraseClass}>
          {words.map((w, i) => {
            // rivelazione concentrata nella prima parte della corsa: tutte le parole
            // sono accese entro REVEAL_END, poi il testo resta bloccato a frase completa
            // fino a fine sezione (margine di "tenuta" prima dello sblocco).
            const REVEAL_END = 0.8;
            const span = REVEAL_END / N;
            const start = (i / N) * REVEAL_END;
            const end = start + span * 1.3; // leggero overlap → reveal fluido
            const lit = mapClamp(progress, start, end, 0, 1);
            return <Word key={i} word={w.word} litColor={w.litColor} lit={lit} />;
          })}
        </p>
      </div>
    </div>
  );
}

export { TextReveal };
