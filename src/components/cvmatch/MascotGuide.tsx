import { useEffect, useRef, useState } from "react";
import { Chameleon } from "./Chameleon";

type Props = {
  /** Contextual message shown in the corner bubble (e.g. while analyzing). */
  message?: string | null;
};

const GREETING = "Olá! Vamos fazer seu currículo chegar ao RH?";

/**
 * Entrance greeting (center, waves while shifting colors) that then settles
 * discreetly into the bottom-right corner.
 */
export function MascotGuide({ message }: Props) {
  const [phase, setPhase] = useState<"intro" | "leaving" | "corner">("intro");
  const [waving, setWaving] = useState(false);
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stay = reduce ? 1200 : 2700;
    timers.current.push(setTimeout(() => setPhase("leaving"), stay));
    timers.current.push(setTimeout(() => setPhase("corner"), stay + 350));
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const waveAgain = () => {
    setWaving(true);
    setLocalMsg(GREETING);
    timers.current.push(setTimeout(() => setWaving(false), 2300));
    timers.current.push(setTimeout(() => setLocalMsg(null), 3600));
  };

  const bubble = message ?? localMsg;

  return (
    <>
      {phase !== "corner" && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-300 ${
            phase === "leaving" ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
          <div className="animate-mascot-pop absolute top-1/2 left-1/2 flex flex-col items-center">
            <div className="animate-bubble-in relative mb-2 rounded-2xl bg-card px-5 py-3 text-center font-display text-lg font-semibold text-primary shadow-card [animation-delay:350ms]">
              Olá! Que bom ter você aqui.
              <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-card" />
            </div>
            <Chameleon mood="waving" className="h-44 w-44 drop-shadow-xl sm:h-52 sm:w-52" />
          </div>
        </div>
      )}

      {phase === "corner" && (
        <div className="animate-rise-in fixed right-3 bottom-3 z-40 flex items-end gap-1 sm:right-5 sm:bottom-5">
          {bubble && (
            <div
              key={bubble}
              role="status"
              className="animate-bubble-in mb-10 max-w-[13rem] rounded-2xl rounded-br-sm bg-card px-3.5 py-2.5 text-sm font-medium text-primary shadow-card"
            >
              {bubble}
            </div>
          )}
          <button
            type="button"
            onClick={waveAgain}
            title="Dar um oi para o camaleão"
            className="rounded-full p-1 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Chameleon
              mood={waving ? "waving" : "idle"}
              className="h-20 w-20 drop-shadow-lg sm:h-24 sm:w-24"
            />
          </button>
        </div>
      )}
    </>
  );
}
