import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, type ChangeEvent } from "react";
import { BriefcaseBusiness, FileText, Loader2, RotateCcw, ScanSearch, Upload, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chameleon } from "@/components/cvmatch/Chameleon";
import { MascotGuide } from "@/components/cvmatch/MascotGuide";
import { AnalysisResults } from "@/components/cvmatch/AnalysisResults";
import { OptimizedCv } from "@/components/cvmatch/OptimizedCv";
import { analyzeCv } from "@/lib/cv.functions";
import { cvInputSchema, MAX_TEXT, type Analysis, type CvInput } from "@/lib/cv-analysis";
import { SAMPLE_JOB, SAMPLE_RESUME } from "@/lib/sample";
import { extractPdfText } from "@/lib/pdf-read";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CVMatch — Compare seu currículo com a vaga" },
      {
        name: "description",
        content:
          "Cole a vaga e seu currículo: o CVMatch mostra a compatibilidade, as palavras-chave ausentes e gera um currículo otimizado para ATS, sem inventar nada.",
      },
      { property: "og:title", content: "CVMatch — Seu talento merece chegar ao RH" },
      {
        property: "og:description",
        content: "Análise de compatibilidade entre currículo e vaga com IA e currículo otimizado para sistemas ATS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = ["Cole a vaga", "Cole seu currículo", "Veja a análise", "Otimize e exporte"];

function TextCard({
  id,
  icon: Icon,
  title,
  hint,
  value,
  onChange,
  placeholder,
  fileName,
  fileLoading,
  onFilePick,
  onFileClear,
}: {
  id: string;
  icon: typeof FileText;
  title: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  fileName?: string | null;
  fileLoading?: boolean;
  onFilePick?: (file: File) => void;
  onFileClear?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFilePick?.(f);
    e.target.value = "";
  };
  return (
    <div className="flex flex-col rounded-3xl bg-card p-5 shadow-card sm:p-6">
      <div className="mb-3 flex items-center gap-3">
        <label htmlFor={id} className="flex flex-1 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-lg font-semibold text-primary">{title}</span>
            <span className="block text-xs text-muted-foreground">{hint}</span>
          </span>
        </label>
        {onFilePick && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={pickFile}
              aria-label="Enviar currículo em PDF"
            />
            {fileName ? (
              <span className="flex max-w-[55%] items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{fileName}</span>
                <button
                  type="button"
                  onClick={onFileClear}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-card"
                  aria-label="Remover PDF"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fileLoading}
                onClick={() => fileRef.current?.click()}
              >
                {fileLoading ? <Loader2 className="animate-spin" /> : <Upload />}
                {fileLoading ? "Lendo PDF…" : "Enviar PDF"}
              </Button>
            )}
          </>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_TEXT}
        className="min-h-[300px] flex-1 resize-y rounded-2xl border border-input bg-muted/40 p-4 text-sm leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/30 focus:outline-none"
      />
      <span className="mt-2 self-end text-xs text-muted-foreground">
        {value.length.toLocaleString("pt-BR")} / {MAX_TEXT.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}

function Index() {
  const analyze = useServerFn(analyzeCv);
  const [job, setJob] = useState("");
  const [resume, setResume] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ analysis: Analysis; input: CvInput } | null>(null);
  const [mascotMsg, setMascotMsg] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const flash = (msg: string, ms = 4500) => {
    setMascotMsg(msg);
    setTimeout(() => setMascotMsg((m) => (m === msg ? null : m)), ms);
  };

  const runAnalysis = async () => {
    setError(null);
    const parsed = cvInputSchema.safeParse({ job, resume });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Verifique os campos.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setAnalyzing(true);
    setMascotMsg("Estou lendo tudo com atenção…");
    try {
      const res = await analyze({ data: parsed.data });
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        setMascotMsg(null);
        return;
      }
      setResult({ analysis: res.analysis, input: parsed.data });
      toast.success("Análise concluída!");
      flash("Pronto! Veja como seu currículo se saiu.");
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      const msg = "Não foi possível concluir a análise. Verifique sua conexão e tente novamente.";
      setError(msg);
      toast.error(msg);
      setMascotMsg(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const fillSample = () => {
    setJob(SAMPLE_JOB);
    setResume(SAMPLE_RESUME);
    setError(null);
    toast("Exemplo preenchido. Agora é só analisar!");
  };

  const reset = () => {
    setJob("");
    setResume("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      <MascotGuide message={mascotMsg ?? (optimizing ? "Caprichando no seu currículo…" : null)} />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <a href="/" className="flex items-center gap-2" aria-label="CVMatch — início">
          <Chameleon mood="still" className="h-11 w-11" title="" />
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            CV<span className="text-primary-soft">Match</span>
          </span>
        </a>
        <span className="hidden font-hand text-xl text-primary-soft sm:block">Prepare-se melhor. Conquiste mais!</span>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-32 sm:px-8">
        <section className="pt-12 pb-10 text-center sm:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-semibold text-primary shadow-soft">
            <ScanSearch className="h-3.5 w-3.5" /> Análise inteligente para sistemas ATS
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl leading-[1.1] font-bold sm:text-6xl">
            Seu talento merece <span className="relative whitespace-nowrap">chegar ao RH.<svg aria-hidden="true" viewBox="0 0 300 14" className="absolute -bottom-2 left-0 h-3 w-full stroke-sky" fill="none"><path d="M3 10 C 80 2, 200 2, 297 8" strokeWidth="6" strokeLinecap="round" /></svg></span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Compare seu currículo com a vaga, descubra as palavras-chave que faltam e gere uma versão otimizada —
            sempre com as suas informações reais.
          </p>
          <ol className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2 sm:gap-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-sm text-foreground shadow-soft">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky text-[11px] font-bold text-sky-foreground">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Informações para análise" className="grid gap-5 md:grid-cols-2">
          <TextCard
            id="job"
            icon={BriefcaseBusiness}
            title="Descrição da vaga"
            hint="Cole o anúncio completo: atividades, requisitos e diferenciais."
            value={job}
            onChange={setJob}
            placeholder="Ex.: Analista de Dados Júnior — Requisitos: SQL, Power BI, Python…"
          />
          <TextCard
            id="resume"
            icon={FileText}
            title="Seu currículo"
            hint="Cole o texto do seu currículo atual."
            value={resume}
            onChange={setResume}
            placeholder="Nome, contato, resumo, experiências, formação, habilidades…"
          />
        </section>

        {error && (
          <p role="alert" className="mx-auto mt-5 max-w-2xl rounded-2xl bg-destructive-soft px-4 py-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="hero" size="xl" onClick={runAnalysis} disabled={analyzing || optimizing}>
            {analyzing ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {analyzing ? "Analisando compatibilidade…" : "Analisar compatibilidade"}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" onClick={fillSample} disabled={analyzing}>
              Usar exemplo
            </Button>
            {(job || resume || result) && (
              <Button variant="ghost" size="lg" onClick={reset} disabled={analyzing || optimizing}>
                <RotateCcw /> Limpar
              </Button>
            )}
          </div>
        </div>
        {analyzing && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Isso costuma levar de 10 a 30 segundos.
          </p>
        )}

        {result && (
          <div ref={resultsRef} className="scroll-mt-6 pt-16">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold">Resultado da análise</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Gerado por IA a partir dos textos que você enviou.
              </p>
            </div>
            <AnalysisResults analysis={result.analysis} />
            <div className="mt-8">
              <OptimizedCv
                key={`${result.input.job.length}-${result.input.resume.length}-${result.analysis.score}`}
                input={result.input}
                missing={result.analysis.missingKeywords}
                onBusyChange={setOptimizing}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
        <p className="font-display font-semibold text-primary">CVMatch</p>
        <p className="mt-1">Seu talento merece chegar ao RH. Seus textos não são armazenados.</p>
      </footer>
    </div>
  );
}
