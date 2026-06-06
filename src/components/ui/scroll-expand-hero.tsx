import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Search,
  Target,
  Wrench,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";

// TODO: sostituisci con il tuo link Calendly/Cal.com reale
const BOOKING_URL = "https://cal.com/boru-studio";

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Entriamo",
    text: "Capiamo come funziona davvero l'azienda prima di toccare qualcosa.",
  },
  {
    n: "02",
    icon: Target,
    title: "Identifichiamo",
    text: "Troviamo insieme dove si perde tempo, fatturato, energia.",
  },
  {
    n: "03",
    icon: Wrench,
    title: "Costruiamo su misura",
    text: "Niente template. Ogni automazione nasce dal tuo processo.",
  },
  {
    n: "04",
    icon: ShieldCheck,
    title: "Non stravolgiamo",
    text: "Continui a lavorare come sempre. Il cambiamento è invisibile.",
  },
] as const;

// helper: mappa v dall'intervallo [a,b] a [c,d], con clamp
const mapClamp = (v: number, a: number, b: number, c: number, d: number) => {
  if (b === a) return c;
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return c + t * (d - c);
};

// easing: parte decisa e rallenta (movimento organico, non meccanico)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Cornice: 4 tacche a "L" agli angoli (stile scheda tecnica), marcate e in accento ruggine.
// Il colore è inline per vincere sulla regola globale `* { border-color: var(--color-border) }`.
function CornerFrame() {
  const rust = { borderColor: "oklch(0.62 0.15 42)" };
  return (
    <>
      {/* alto-sinistra */}
      <span style={rust} className="absolute left-5 top-5 size-8 border-l-2 border-t-2 sm:left-8 sm:top-8 sm:size-10" />
      {/* alto-destra */}
      <span style={rust} className="absolute right-5 top-5 size-8 border-r-2 border-t-2 sm:right-8 sm:top-8 sm:size-10" />
      {/* basso-sinistra */}
      <span style={rust} className="absolute bottom-5 left-5 size-8 border-b-2 border-l-2 sm:bottom-8 sm:left-8 sm:size-10" />
      {/* basso-destra */}
      <span style={rust} className="absolute bottom-5 right-5 size-8 border-b-2 border-r-2 sm:bottom-8 sm:right-8 sm:size-10" />
    </>
  );
}

function ScrollExpandHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);
  const [vp, setVp] = useState({ w: 1280, h: 800, mobile: false });
  // progress 0 → 1: quanto la sezione è stata scrollata (engine semplice e affidabile)
  const [progress, setProgress] = useState(0);

  // reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // viewport
  useEffect(() => {
    const measure = () =>
      setVp({
        w: window.innerWidth,
        h: window.innerHeight,
        mobile: window.innerWidth < 768,
      });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // engine di scroll: aggiorna sia sull'evento `scroll` (immediato) sia in un
  // loop rAF (fluido). Doppia sorgente → robusto in ogni ambiente.
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
  }, [reduce, vp.h]);

  if (reduce) return <StaticHero />;

  // ── valori derivati (pura matematica) ──
  // Due fasi:
  //  FASE 1 (0 → 0.22): il titolo è protagonista, parte centrato e SALE alla
  //    posizione finale. La card è solo accennata sotto (piccola, semi-trasparente).
  //  FASE 2 (0.3 → 1): parte il reveal — la card prende opacità piena e si espande,
  //    poi compaiono le 4 mosse.
  const startW = vp.mobile ? 260 : 340;
  const startH = vp.mobile ? 150 : 170; // fessura iniziale più sottile (apertura "a condotto")

  // CROSSFADE: la card (schermo nero) appare RAVVICINATA, mentre il titolo sta ancora
  // sfumando e salendo via. Compresenza solo dei fade (card piccola/in crescita) → niente
  // testo schiacciato sul nero, ma nessuna attesa morta.

  // FASE 1 — titolo: parte centrato (+24vh), sale a 0, poi esce verso l'alto.
  const introY =
    mapClamp(progress, 0, 0.18, vp.h * 0.24, 0) +
    mapClamp(progress, 0.2, 0.34, 0, -vp.h * 0.18);
  const introOpacity = mapClamp(progress, 0.2, 0.34, 1, 0);

  // la card appare mentre il titolo sta sfumando; il nero "si posa" (eased) invece di sbattere
  const panelEntryOpacity = easeOutCubic(mapClamp(progress, 0.22, 0.34, 0, 1));

  // FASE 2 — apertura "a condotto": prima si allarga in orizzontale (fessura), poi in verticale.
  // LINEARE: l'apertura segue lo scroll 1:1 (nessuno scatto), ma i range sfalsati mantengono il condotto.
  const wE = mapClamp(progress, 0.3, 0.5, 0, 1); // larghezza: 0.30→0.50
  const hE = mapClamp(progress, 0.4, 0.62, 0, 1); // altezza: 0.40→0.62 (overlap 0.40–0.50)
  const panelW = startW + wE * (vp.w - startW);
  const panelH = startH + hE * (vp.h - startH);
  const panelRadius = mapClamp(progress, 0.52, 0.62, 18, 0); // angoli morbidi tenuti più a lungo
  const expandEased = mapClamp(progress, 0.3, 0.62, 0, 1); // per ombra che cresce (lineare, segue la crescita)

  // crossfade label→contenuto: nessun "vuoto" con card scura e vuota durante la crescita
  const labelOpacity = mapClamp(progress, 0.4, 0.56, 1, 0);

  // la cornice incornicia il titolo e sfuma insieme a lui
  const frameOpacity = mapClamp(progress, 0.2, 0.32, 1, 0);

  // indicatore di scroll (linea + label) sotto il titolo: visibile a inizio, sfuma subito
  const cueOpacity = mapClamp(progress, 0, 0.16, 1, 0);

  const contentOpacity = mapClamp(progress, 0.52, 0.72, 0, 1);
  const contentY = mapClamp(progress, 0.52, 0.78, 24, 0);

  return (
    <section
      ref={sectionRef}
      className="relative h-[260vh] w-full bg-background"
      aria-label="Introduzione BORU studio"
    >
      {/* viewport sticky che resta fermo mentre la sezione scorre */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* griglia di sfondo, discreta — sfuma quando il pannello riempie lo schermo */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: 1 - contentOpacity }}
        >
          <GridPattern
            width={48}
            height={48}
            x={-1}
            y={-1}
            className={cn(
              "[mask-image:radial-gradient(680px_circle_at_center,white,transparent)]",
              "fill-accent/[0.05] stroke-accent/15",
            )}
          />
        </div>

        {/* Cornice a tacche d'angolo — incornicia il titolo, poi sfuma all'inizio dell'espansione */}
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            opacity: frameOpacity,
            visibility: frameOpacity <= 0.01 ? "hidden" : "visible",
          }}
        >
          <CornerFrame />
        </div>

        {/* Intro: solo il titolo, ancorato in alto così non si sovrappone al pannello */}
        <div
          className="pointer-events-none absolute top-[16vh] z-20 flex max-w-5xl flex-col items-center px-6 text-center"
          style={{
            opacity: introOpacity,
            transform: `translateY(${introY}px)`,
            visibility: introOpacity <= 0.01 ? "hidden" : "visible",
          }}
        >
          <h1
            className="pointer-events-auto text-balance text-6xl font-semibold leading-[1.02] tracking-tighter text-foreground sm:text-7xl md:text-8xl"
            onMouseMove={(e) => {
              const lines = e.currentTarget.querySelectorAll<HTMLElement>(".title-spotlight");
              lines.forEach((el) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty("--mx", `${e.clientX - r.left}px`);
                el.style.setProperty("--my", `${e.clientY - r.top}px`);
                el.style.setProperty("--spot", "1");
              });
            }}
            onMouseLeave={(e) => {
              e.currentTarget
                .querySelectorAll<HTMLElement>(".title-spotlight")
                .forEach((el) => el.style.setProperty("--spot", "0"));
            }}
          >
            <span className="title-spotlight block" data-text="Il sistema cambia per te.">
              Il sistema cambia per te.
            </span>
            <span
              className="title-spotlight block text-muted-foreground"
              data-text="Non il contrario."
            >
              Non il contrario.
            </span>
          </h1>
        </div>

        {/* Indicatore di scroll: linea verticale ruggine + label, sotto il titolo */}
        <div
          className="pointer-events-none absolute bottom-[14vh] z-20 flex flex-col items-center gap-3"
          style={{
            opacity: cueOpacity,
            visibility: cueOpacity <= 0.01 ? "hidden" : "visible",
          }}
        >
          <span
            className="h-12 w-px"
            style={{
              background:
                "linear-gradient(to bottom, transparent, oklch(0.62 0.15 42))",
            }}
          />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            scorri per aprire il processo
          </span>
        </div>

        {/* Il pannello scuro che si espande = "il tuo processo" che si apre.
            In fase 1 è invisibile; fade-in + espansione solo in fase 2, sempre centrato. */}
        <div
          className="relative z-10 flex items-center justify-center overflow-hidden bg-[oklch(0.18_0.008_60)]"
          style={{
            width: `${panelW}px`,
            height: `${panelH}px`,
            borderRadius: `${panelRadius}px`,
            opacity: panelEntryOpacity,
            boxShadow: `0 ${20 + expandEased * 60}px ${60 + expandEased * 100}px -40px rgba(20,19,15,${0.3 + expandEased * 0.25})`,
          }}
        >
          {/* fessura: linea ruggine al centro (il "condotto") che si allarga col pannello,
              restando sempre staccata dai bordi (margine fisso per lato) */}
          <div className="absolute" style={{ opacity: labelOpacity }}>
            <span
              className="block h-px"
              style={{
                width: `${Math.max(panelW - 192, 48)}px`,
                background:
                  "linear-gradient(to right, transparent, oklch(0.62 0.15 42), transparent)",
              }}
            />
          </div>

          {/* contenuto rivelato quando il pannello è espanso (testo chiaro su scuro) */}
          <div
            className="flex max-h-full w-full max-w-5xl flex-col justify-center overflow-y-auto px-6 py-10 md:px-12"
            style={{
              opacity: contentOpacity,
              transform: `translateY(${contentY}px)`,
              pointerEvents: contentOpacity > 0.5 ? "auto" : "none",
            }}
          >
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[oklch(0.7_0.13_42)]">
              dentro il tuo processo
            </p>
            <h2 className="mb-8 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-white md:text-4xl">
              Entriamo, capiamo, e costruiamo l'automazione — su misura.
            </h2>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.n} className="bg-[oklch(0.2_0.008_60)] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <Icon
                        className="size-5 text-[oklch(0.7_0.13_42)]"
                        aria-hidden="true"
                      />
                      <span className="font-mono text-xs text-white/45">{s.n}</span>
                    </div>
                    <h3 className="mb-1.5 text-base font-semibold text-white">
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/60">{s.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[oklch(0.2_0.01_60)] transition-colors duration-200 hover:bg-[oklch(0.7_0.13_42)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <CalendarClock className="size-[18px]" aria-hidden="true" />
                Prenota la call di analisi
              </a>
              <a
                href="#essence"
                className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-[oklch(0.7_0.13_42)] hover:text-[oklch(0.7_0.13_42)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Come lavoriamo
                <ArrowRight
                  className="size-[18px] transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Variante per prefers-reduced-motion: STESSO contenuto della versione animata
 *  (titolo + processo con le 4 mosse), ma fermo — niente effetto scroll-expand.
 *  Così chi preferisce meno movimento vede comunque tutto, incluso il "rettangolo". */
function StaticHero() {
  return (
    <>
      {/* Schermata titolo */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-24 text-center">
        <CornerFrame />
        <GridPattern
          width={48}
          height={48}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:radial-gradient(640px_circle_at_center,white,transparent)]",
            "fill-accent/[0.05] stroke-accent/15",
          )}
        />
        <div className="relative z-10 flex max-w-5xl flex-col items-center">
          <h1 className="text-balance text-6xl font-semibold leading-[1.02] tracking-tighter text-foreground sm:text-7xl md:text-8xl">
            <span className="block">Il sistema cambia per te.</span>
            <span className="block text-muted-foreground">Non il contrario.</span>
          </h1>
          <p className="mt-7 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
            Non sei tu a doverti adattare a un nuovo software. Entriamo nei tuoi
            processi così come sono, capiamo dove si perde tempo e fatturato, e
            costruiamo l'automazione giusta — intorno a come lavori già.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-medium text-primary-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
            >
              <CalendarClock className="size-[18px]" aria-hidden="true" />
              Prenota la call di analisi
            </a>
            <a
              href="#essence"
              className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-base font-medium text-foreground transition-colors duration-200 hover:border-accent hover:text-accent"
            >
              Come lavoriamo
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Il "processo" — stesso pannello scuro della versione animata, ma già aperto e fermo */}
      <section className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-20">
        <div className="flex w-full max-w-5xl flex-col justify-center rounded-2xl bg-[oklch(0.18_0.008_60)] px-6 py-12 shadow-[0_40px_120px_-40px_rgba(20,19,15,0.5)] md:px-12">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[oklch(0.7_0.13_42)]">
            dentro il tuo processo
          </p>
          <h2 className="mb-8 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-white md:text-4xl">
            Entriamo, capiamo, e costruiamo l'automazione — su misura.
          </h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="bg-[oklch(0.2_0.008_60)] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <Icon className="size-5 text-[oklch(0.7_0.13_42)]" aria-hidden="true" />
                    <span className="font-mono text-xs text-white/45">{s.n}</span>
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-white">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-white/60">{s.text}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[oklch(0.2_0.01_60)] transition-colors duration-200 hover:bg-[oklch(0.7_0.13_42)] hover:text-white"
            >
              <CalendarClock className="size-[18px]" aria-hidden="true" />
              Prenota la call di analisi
            </a>
            <a
              href="#essence"
              className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-[oklch(0.7_0.13_42)] hover:text-[oklch(0.7_0.13_42)]"
            >
              Come lavoriamo
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export { ScrollExpandHero };
