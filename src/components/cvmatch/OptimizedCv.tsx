import { useRef, useState } from "react";
import { Check, Copy, FileDown, Loader2, ShieldCheck, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { STREAM_ERROR_MARKER, type CvInput } from "@/lib/cv-analysis";
import { exportCvPdf } from "@/lib/pdf";

type Props = {
  input: CvInput;
  missing: string[];
  onBusyChange?: (busy: boolean) => void;
};

export function OptimizedCv({ input, missing, onBusyChange }: Props) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    setStatus("loading");
    setError(null);
    setText("");
    onBusyChange?.(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, missing }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Não foi possível gerar o currículo. Tente novamente.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const markerAt = acc.indexOf(STREAM_ERROR_MARKER);
        if (markerAt >= 0) {
          setText(acc.slice(0, markerAt).trim());
          throw new Error(acc.slice(markerAt + STREAM_ERROR_MARKER.length));
        }
        setText(acc);
      }
      setText(acc.trim());
      setStatus("done");
      toast.success("Currículo otimizado pronto!");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setStatus("done");
        toast("Geração interrompida.");
      } else {
        const msg = (e as Error).message || "Erro inesperado.";
        setError(msg);
        setStatus("error");
        toast.error(msg);
      }
    } finally {
      abortRef.current = null;
      onBusyChange?.(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Currículo copiado para a área de transferência.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      await exportCvPdf(text);
      toast.success("PDF baixado com sucesso.");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setExporting(false);
    }
  };

  const loading = status === "loading";
  const hasText = text.length > 0;

  return (
    <section className="rounded-3xl bg-card p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Currículo otimizado</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Reorganizamos seu currículo com a linguagem da vaga — usando apenas as informações que você
            forneceu.
          </p>
        </div>
        {loading ? (
          <Button variant="outline" size="lg" onClick={() => abortRef.current?.abort()}>
            <Square /> Parar
          </Button>
        ) : (
          <Button variant="hero" size="xl" onClick={generate}>
            <Sparkles />
            {status === "idle" ? "Gerar currículo otimizado" : "Gerar novamente"}
          </Button>
        )}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          O CVMatch nunca inventa experiências, empresas, formações ou certificados. Requisitos ausentes
          ficam de fora — inclua-os você mesmo apenas se realmente os possuir.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-destructive-soft px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {(hasText || loading) && (
        <div className="mt-5">
          <div className="relative max-h-[640px] overflow-auto rounded-2xl border border-border bg-muted/40 p-5 sm:p-8">
            {loading && !hasText ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Escrevendo seu currículo com cuidado…
              </div>
            ) : (
              <div className="cv-doc text-sm text-foreground">
                {text.split("\n").map((line, i) => {
                  const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, "");
                  const heading =
                    i > 0 && letters.length >= 3 && letters === letters.toUpperCase() && line.length < 60;
                  if (i === 0)
                    return (
                      <div key={i} className="font-display text-xl font-bold text-primary">
                        {line}
                      </div>
                    );
                  if (heading)
                    return (
                      <div key={i} className="mt-3 border-b border-sky pb-1 font-display text-sm font-bold tracking-wide text-primary">
                        {line}
                      </div>
                    );
                  return <div key={i}>{line || "\u00a0"}</div>;
                })}
                {loading && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="soft" size="lg" onClick={copy} disabled={!hasText || loading}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copiado!" : "Copiar texto"}
            </Button>
            <Button variant="outline" size="lg" onClick={exportPdf} disabled={!hasText || loading || exporting}>
              {exporting ? <Loader2 className="animate-spin" /> : <FileDown />}
              Exportar PDF
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
