import { describe, expect, it } from "vitest";
import { cvInputSchema, normalizeAnalysis, scoreLevel, type Analysis } from "@/lib/cv-analysis";

const base: Analysis = {
  score: 50,
  summary: "ok",
  foundKeywords: [],
  missingKeywords: [],
  requirements: [],
  suggestions: [],
};

describe("cv analysis rules", () => {
  it("clamps the compatibility score to 0–100", () => {
    expect(normalizeAnalysis({ ...base, score: 140 }).score).toBe(100);
    expect(normalizeAnalysis({ ...base, score: -5 }).score).toBe(0);
    expect(normalizeAnalysis({ ...base, score: 72.6 }).score).toBe(73);
  });

  it("never lists a keyword as both found and missing", () => {
    const r = normalizeAnalysis({ ...base, foundKeywords: ["SEO"], missingKeywords: ["seo", "Figma"] });
    expect(r.missingKeywords).toEqual(["Figma"]);
  });

  it("labels score bands", () => {
    expect(scoreLevel(49).tone).toBe("low");
    expect(scoreLevel(50).tone).toBe("mid");
    expect(scoreLevel(75).tone).toBe("high");
  });

  it("rejects empty job or resume text", () => {
    expect(cvInputSchema.safeParse({ job: "", resume: "x".repeat(100) }).success).toBe(false);
    expect(cvInputSchema.safeParse({ job: "x".repeat(100), resume: "x".repeat(100) }).success).toBe(true);
  });
});
