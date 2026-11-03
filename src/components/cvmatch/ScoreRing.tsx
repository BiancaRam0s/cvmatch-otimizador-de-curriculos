import { useEffect, useState } from "react";
import { scoreLevel } from "@/lib/cv-analysis";
import { cn } from "@/lib/utils";

const toneStroke = {
  low: "stroke-destructive",
  mid: "stroke-warning",
  high: "stroke-success",
} as const;

export function ScoreRing({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  const r = 52;
  const c = 2 * Math.PI * r;
  const level = scoreLevel(score);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx={60} cy={60} r={r} className="fill-none stroke-sky/50" strokeWidth={11} />
          <circle
            cx={60}
            cy={60}
            r={r}
            className={cn("fill-none transition-[stroke-dashoffset] duration-1000 ease-out", toneStroke[level.tone])}
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * shown) / 100}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold text-primary">{score}%</span>
          <span className="text-xs text-muted-foreground">compatível</span>
        </div>
      </div>
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold",
          level.tone === "high" && "bg-success-soft text-success",
          level.tone === "mid" && "bg-warning-soft text-warning",
          level.tone === "low" && "bg-destructive-soft text-destructive",
        )}
      >
        {level.label}
      </span>
    </div>
  );
}
