import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { cvInputSchema, STREAM_ERROR_MARKER } from "@/lib/cv-analysis";

const bodySchema = cvInputSchema.extend({
  missing: z.array(z.string().max(80)).max(30).optional(),
});

function json(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/optimize")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return json(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
        }
        const { streamText } = await import("ai");
        const { createChatModel, responsesOptions, describeAiError } = await import(
          "@/lib/ai/gateway.server"
        );
        const { OPTIMIZE_INSTRUCTIONS, buildUserPrompt } = await import("@/lib/cv-prompts.server");

        let iterator: AsyncIterator<{ type: string; text?: string; error?: unknown }>;
        try {
          const result = streamText({
            model: createChatModel(),
            instructions: OPTIMIZE_INSTRUCTIONS,
            messages: [
              {
                role: "user",
                content: buildUserPrompt(parsed.data.job, parsed.data.resume, parsed.data.missing),
              },
            ],
            abortSignal: request.signal,
            providerOptions: responsesOptions,
          });
          iterator = result.fullStream[Symbol.asyncIterator]() as typeof iterator;
        } catch (e) {
          const d = describeAiError(e);
          return json(d.status, d.message);
        }

        // Wait for the first text (or failure) so early errors keep their HTTP status.
        let first = "";
        try {
          while (true) {
            const { value, done } = await iterator.next();
            if (done) break;
            if (value.type === "error") throw value.error;
            if (value.type === "text-delta" && value.text) {
              first = value.text;
              break;
            }
          }
        } catch (e) {
          const d = describeAiError(e);
          return json(d.status, d.message);
        }
        if (!first) return json(502, "A IA não retornou conteúdo. Tente novamente.");

        const encoder = new TextEncoder();
        const body = new ReadableStream<Uint8Array>({
          async start(controller) {
            controller.enqueue(encoder.encode(first));
            try {
              while (true) {
                const { value, done } = await iterator.next();
                if (done) break;
                if (value.type === "error") throw value.error;
                if (value.type === "text-delta" && value.text) {
                  controller.enqueue(encoder.encode(value.text));
                }
              }
            } catch (e) {
              controller.enqueue(encoder.encode(STREAM_ERROR_MARKER + describeAiError(e).message));
            }
            controller.close();
          },
          cancel() {
            void iterator.return?.();
          },
        });
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
