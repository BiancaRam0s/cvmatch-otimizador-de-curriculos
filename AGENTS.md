<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- AI calls (analysis + CV optimization) run server-side only: `src/lib/cv.functions.ts` (structured analysis) and `src/routes/api/optimize.ts` (streamed text); gateway helpers live in `src/lib/ai/gateway.server.ts`. Why: keeps the API key and prompts off the client.
- Shared input validation, analysis schema and score normalization live in `src/lib/cv-analysis.ts` (client-safe) with tests in `src/test/cv-analysis.test.ts`. Why: one source of truth for client and server.
- The mascot is an inline SVG (`src/components/cvmatch/Chameleon.tsx`) animated with CSS classes in `src/styles.css`. Why: lets the arm wave and colors shift without image assets.
- No auth, database or history in the MVP. Why: explicit scope of the product brief.
