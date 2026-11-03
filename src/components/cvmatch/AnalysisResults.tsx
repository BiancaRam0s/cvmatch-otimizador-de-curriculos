import { CheckCircle2, CircleAlert, CircleDashed, Lightbulb, ListChecks, Tag, TagsIcon } from "lucide-react";
import { CATEGORY_LABEL, type Analysis } from "@/lib/cv-analysis";
import { cn } from "@/lib/utils";
import { ScoreRing } from "./ScoreRing";

function SectionTitle({ icon: Icon, children }: { icon: typeof Tag; children: React.ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-2.5 text-lg font-semibold">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      {children}
    </h3>
  );
}

const statusStyle = {
  atendido: { icon: CheckCircle2, label: "Atendido", cls: "bg-success-soft text-success" },
  parcial: { icon: CircleDashed, label: "Parcial", cls: "bg-warning-soft text-warning" },
  ausente: { icon: CircleAlert, label: "Ausente", cls: "bg-destructive-soft text-destructive" },
} as const;

export function AnalysisResults({ analysis }: { analysis: Analysis }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="animate-rise-in flex flex-col items-center gap-4 rounded-3xl bg-card p-6 text-center shadow-card">
        <h3 className="text-lg font-semibold">Compatibilidade</h3>
        <ScoreRing score={analysis.score} />
        <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
      </section>

      <section className="animate-rise-in rounded-3xl bg-card p-6 shadow-card [animation-delay:80ms] lg:col-span-2">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <SectionTitle icon={Tag}>
              Encontradas <span className="text-sm font-normal text-muted-foreground">({analysis.foundKeywords.length})</span>
            </SectionTitle>
            {analysis.foundKeywords.length ? (
              <ul className="flex flex-wrap gap-2">
                {analysis.foundKeywords.map((k) => (
                  <li key={k} className="flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {k}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma palavra-chave da vaga foi encontrada.</p>
            )}
          </div>
          <div>
            <SectionTitle icon={TagsIcon}>
              Ausentes <span className="text-sm font-normal text-muted-foreground">({analysis.missingKeywords.length})</span>
            </SectionTitle>
            {analysis.missingKeywords.length ? (
              <ul className="flex flex-wrap gap-2">
                {analysis.missingKeywords.map((k) => (
                  <li key={k} className="rounded-full border border-dashed border-destructive/40 bg-destructive-soft px-3 py-1 text-sm font-medium text-destructive">
                    {k}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Ótimo! Nenhuma palavra-chave importante ficou de fora.</p>
            )}
          </div>
        </div>
      </section>

      <section className="animate-rise-in rounded-3xl bg-card p-6 shadow-card [animation-delay:160ms] lg:col-span-2">
        <SectionTitle icon={ListChecks}>Competências e requisitos da vaga</SectionTitle>
        <ul className="divide-y divide-border">
          {analysis.requirements.map((r, i) => {
            const s = statusStyle[r.status];
            return (
              <li key={`${r.item}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.item}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[r.category]}</p>
                </div>
                <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="animate-rise-in rounded-3xl bg-gradient-sky p-6 shadow-card [animation-delay:240ms]">
        <SectionTitle icon={Lightbulb}>Sugestões</SectionTitle>
        <ol className="space-y-4">
          {analysis.suggestions.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">{s.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-foreground/80">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
