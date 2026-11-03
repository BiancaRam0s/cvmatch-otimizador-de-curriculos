import { z } from "zod";

export const MIN_TEXT = 80;
export const MAX_TEXT = 15000;

export const cvInputSchema = z.object({
  job: z
    .string()
    .trim()
    .min(MIN_TEXT, { message: `A descrição da vaga precisa ter pelo menos ${MIN_TEXT} caracteres.` })
    .max(MAX_TEXT, { message: `A descrição da vaga pode ter no máximo ${MAX_TEXT} caracteres.` }),
  resume: z
    .string()
    .trim()
    .min(MIN_TEXT, { message: `O currículo precisa ter pelo menos ${MIN_TEXT} caracteres.` })
    .max(MAX_TEXT, { message: `O currículo pode ter no máximo ${MAX_TEXT} caracteres.` }),
});

export type CvInput = z.infer<typeof cvInputSchema>;

export const REQUIREMENT_CATEGORIES = [
  "tecnica",
  "comportamental",
  "formacao",
  "experiencia",
  "idioma",
  "outro",
] as const;
export const REQUIREMENT_STATUSES = ["atendido", "parcial", "ausente"] as const;

/** Strict-compatible schema used for the model's structured output. */
export const analysisSchema = z.object({
  score: z.number(),
  summary: z.string(),
  foundKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  requirements: z.array(
    z.object({
      item: z.string(),
      category: z.enum(REQUIREMENT_CATEGORIES),
      status: z.enum(REQUIREMENT_STATUSES),
    }),
  ),
  suggestions: z.array(z.object({ title: z.string(), detail: z.string() })),
});

export type Analysis = z.infer<typeof analysisSchema>;

export const LIMITS = { keywords: 18, requirements: 14, suggestions: 6 } as const;

function uniqueClean(list: string[], max: number) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const v = raw.trim();
    const key = v.toLowerCase();
    if (!v || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

/** Clamps and de-duplicates model output so the UI always gets sane values. */
export function normalizeAnalysis(a: Analysis): Analysis {
  const score = Number.isFinite(a.score) ? Math.round(Math.min(100, Math.max(0, a.score))) : 0;
  const found = uniqueClean(a.foundKeywords, LIMITS.keywords);
  const foundKeys = new Set(found.map((k) => k.toLowerCase()));
  const missing = uniqueClean(a.missingKeywords, LIMITS.keywords).filter(
    (k) => !foundKeys.has(k.toLowerCase()),
  );
  return {
    score,
    summary: a.summary.trim(),
    foundKeywords: found,
    missingKeywords: missing,
    requirements: a.requirements.filter((r) => r.item.trim()).slice(0, LIMITS.requirements),
    suggestions: a.suggestions
      .filter((s) => s.title.trim() || s.detail.trim())
      .slice(0, LIMITS.suggestions),
  };
}

export type ScoreLevel = { label: string; tone: "low" | "mid" | "high" };

/** 0–49 baixa, 50–74 média, 75–100 alta compatibilidade. */
export function scoreLevel(score: number): ScoreLevel {
  if (score >= 75) return { label: "Alta compatibilidade", tone: "high" };
  if (score >= 50) return { label: "Compatibilidade média", tone: "mid" };
  return { label: "Baixa compatibilidade", tone: "low" };
}

export const CATEGORY_LABEL: Record<(typeof REQUIREMENT_CATEGORIES)[number], string> = {
  tecnica: "Técnica",
  comportamental: "Comportamental",
  formacao: "Formação",
  experiencia: "Experiência",
  idioma: "Idioma",
  outro: "Outro",
};

export const STREAM_ERROR_MARKER = "\u0000[[CVMATCH_ERROR]]";
