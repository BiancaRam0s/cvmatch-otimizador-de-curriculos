import { createServerFn } from "@tanstack/react-start";
import { cvInputSchema, type Analysis } from "./cv-analysis";

export type AnalyzeResult = { ok: true; analysis: Analysis } | { ok: false; error: string };

export const analyzeCv = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => cvInputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const { streamText, Output, NoObjectGeneratedError } = await import("ai");
    const { createChatModel, responsesOptions, describeAiError } = await import(
      "./ai/gateway.server"
    );
    const { ANALYSIS_INSTRUCTIONS, buildUserPrompt } = await import("./cv-prompts.server");
    const { analysisSchema, normalizeAnalysis } = await import("./cv-analysis");

    try {
      const result = streamText({
        model: createChatModel(),
        instructions: ANALYSIS_INSTRUCTIONS,
        messages: [{ role: "user", content: buildUserPrompt(data.job, data.resume) }],
        output: Output.object({ schema: analysisSchema }),
        providerOptions: responsesOptions,
      });
      let output: Analysis;
      try {
        output = (await result.output) as Analysis;
      } catch (e) {
        if (NoObjectGeneratedError.isInstance(e) && e.text) {
          const parsed = analysisSchema.safeParse(JSON.parse(e.text));
          if (!parsed.success) throw e;
          output = parsed.data;
        } else {
          throw e;
        }
      }
      return { ok: true, analysis: normalizeAnalysis(output) };
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        return {
          ok: false,
          error: "A IA não retornou uma análise válida desta vez. Tente novamente.",
        };
      }
      return { ok: false, error: describeAiError(e).message };
    }
  });
