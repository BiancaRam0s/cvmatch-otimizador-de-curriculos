import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, RetryError } from "ai";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
export const CHAT_MODEL = "openai/gpt-6-astra";
const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export class AiNotConfiguredError extends Error {}

function createRunIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
    const response = await fetch(input, { ...init, headers });
    runId ??= response.headers.get(RUN_ID_HEADER)?.trim() || undefined;
    return response;
  };
}

/** Request-scoped Responses model through Lovable AI Gateway. */
export function createChatModel() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiNotConfiguredError("LOVABLE_API_KEY ausente");
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: createRunIdFetch(),
  });
  return provider.responses(CHAT_MODEL);
}

export const responsesOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

function safeBodyMessage(body: string | undefined): string | undefined {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body) as { message?: unknown; error?: { message?: unknown } | string };
    if (typeof parsed.message === "string") return parsed.message;
    if (typeof parsed.error === "string") return parsed.error;
    if (parsed.error && typeof parsed.error.message === "string") return parsed.error.message;
  } catch {
    /* not JSON */
  }
  return undefined;
}

/** Maps any AI failure to a status and a friendly Portuguese message. */
export function describeAiError(error: unknown): { status: number; message: string } {
  if (error instanceof AiNotConfiguredError) {
    return {
      status: 503,
      message:
        "A integração de IA ainda não está configurada neste ambiente. Não é possível gerar análises reais no momento.",
    };
  }
  let err: unknown = error;
  if (RetryError.isInstance(err)) err = err.lastError;
  if (!APICallError.isInstance(err) && err instanceof Error && APICallError.isInstance(err.cause)) {
    err = err.cause;
  }
  if (APICallError.isInstance(err)) {
    const status = err.statusCode ?? 500;
    const detail = safeBodyMessage(err.responseBody);
    if (status === 402)
      return {
        status,
        message: detail ?? "Os créditos de IA do workspace acabaram. Adicione créditos para continuar.",
      };
    if (status === 429)
      return {
        status,
        message: "Muitas solicitações em pouco tempo. Aguarde alguns instantes e tente novamente.",
      };
    if (status === 401)
      return { status, message: "A integração de IA não está configurada corretamente." };
    if (status === 403)
      return { status, message: detail ?? "O acesso à IA foi negado para este workspace." };
    if (status === 400)
      return {
        status,
        message: "Não foi possível processar estes textos. Tente reduzir o tamanho e envie novamente.",
      };
    return {
      status,
      message: "O serviço de IA está instável no momento. Tente novamente em alguns instantes.",
    };
  }
  if (err instanceof Error && err.name === "AbortError") {
    return { status: 499, message: "Solicitação cancelada." };
  }
  console.error("AI error", error);
  return { status: 500, message: "Algo deu errado ao falar com a IA. Tente novamente." };
}
