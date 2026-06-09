import { ArrowRight, CalendarClock } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { TextReveal } from "@/components/ui/text-reveal";
import { PillarsCarousel } from "@/components/ui/pillars-carousel";
import logoNero from "@/assets/logo-nero.png";

// Sezione Dati: numeri scroll-driven uno alla volta (componente dedicato)
export { ScrollStepMetrics as Dati } from "@/components/ui/scroll-step-metrics";

// TODO: sostituisci con il tuo link Calendly/Cal.com reale
const BOOKING_URL = "https://cal.com/boru-studio";
// parola evidenziata su fondo chiaro: azzurro "profondo" per risaltare con contrasto
const ACCENT = "var(--accent-strong)";

/* ============================ ESSENCE ============================ */
export function Essence() {
  return (
    <section id="essence" className="w-full border-t border-border bg-background">
      {/* manifesto: la frase si riempie di colore scrollando; solo "adattamento" in azzurro */}
      <TextReveal
        heightVh={150}
        heightVhMobile={135}
        stickyVh={100}
        segments={[
          { text: "In una parola:", litColor: "var(--foreground)" },
          { text: "adattamento", litColor: ACCENT },
        ]}
        className="flex-nowrap justify-center whitespace-nowrap text-center font-title text-[3vw] uppercase tracking-tight md:text-4xl"
      />
    </section>
  );
}

/* ============================ PILASTRI ============================ */
const PILLARS = [
  {
    n: "01",
    title: "Il sistema si adatta a te",
    text: "Non chiediamo di cambiare strumenti, abitudini o processi. Entriamo nel modo in cui lavori già e costruiamo intorno a te. Il cambiamento è invisibile — i risultati no.",
  },
  {
    n: "02",
    title: "Prima capiamo, poi costruiamo",
    text: "Non esistono soluzioni pronte. Prima di scrivere una riga di codice osserviamo il processo, misuriamo il problema, e verifichiamo che ci sia davvero qualcosa da automatizzare. Se non c'è, lo diciamo.",
  },
  {
    n: "03",
    title: "I dati sono l'argomento più onesto",
    text: "Non chiediamo fiducia a scatola chiusa. Misuriamo il problema prima di proporre la soluzione: quanto tempo assorbe, quanto vale, quanto si può recuperare. Il numero parla prima di noi.",
  },
  {
    n: "04",
    title: "Presenza, non distanza",
    text: "Siamo un servizio professionale, non una piattaforma. C'è una persona che risponde, che segue, che capisce quando qualcosa non funziona. La relazione è parte del servizio.",
  },
];

export function Pilastri() {
  return <PillarsCarousel pillars={PILLARS} />;
}

/* Sezione USP: quote in card scura scroll-driven (componente dedicato) */
export { UspQuote as Usp } from "@/components/ui/usp-quote";

/* ============================ CONTATTO + FOOTER ============================ */
export function Contatto() {
  return (
    <>
      <section
        id="contatto"
        className="w-full border-t border-border bg-background px-6 py-32 text-center md:py-44"
      >
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <h2 className="font-title text-balance text-3xl uppercase leading-[1.08] tracking-tight text-foreground md:text-5xl">
              Il primo passo è capire se possiamo aiutarti.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Una call di analisi, senza impegno. Guardiamo insieme un tuo processo e ti diciamo
              onestamente se c'è qualcosa che vale la pena automatizzare.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
                href="mailto:ciao@boru.studio"
                className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-base font-medium text-foreground transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                Scrivici una mail
                <ArrowRight className="size-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              risponde una persona, non un bot · in genere entro 24 ore
            </p>
          </Reveal>
        </div>
      </section>

      <footer className="w-full border-t border-border bg-background px-6 py-14">
        <div className="mx-auto flex max-w-5xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <img src={logoNero} alt="BORU studio" className="h-14 w-auto select-none md:h-16" draggable={false} />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Il sistema cambia per te. Non il contrario.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground md:items-end">
            <a href="mailto:ciao@boru.studio" className="transition-colors hover:text-accent">
              ciao@boru.studio
            </a>
            <span>Automazione su misura per PMI</span>
            <span>© {new Date().getFullYear()} BORU studio</span>
          </div>
        </div>
      </footer>
    </>
  );
}
