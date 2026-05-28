import type { AnalysisResult } from "@/lib/ai.functions";
import type { GeminiRawAnalysis } from "@/lib/gemini.server";
import { categoryToSkillSlug } from "@/lib/workers.shared";

function parseInrRange(text?: string): { min: number; max: number } {
  if (!text) return { min: 0, max: 0 };
  const nums = text.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return { min: 0, max: 0 };
  if (nums.length === 1) return { min: nums[0]!, max: nums[0]! };
  return { min: Math.min(nums[0]!, nums[1]!), max: Math.max(nums[0]!, nums[1]!) };
}

function parseMinutes(text?: string): number {
  if (!text) return 30;
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 30;
}

export function mapGeminiToAnalysisResult(raw: GeminiRawAnalysis): AnalysisResult {
  const isSmall = raw.problemType?.toLowerCase() === "small";
  const workerType = categoryToSkillSlug(raw.category ?? "other");

  if (isSmall) {
    const cost = parseInrRange(raw.diyTotalCost);
    return {
      severity: "diy",
      problemName: raw.problemName ?? "Home repair",
      reason: raw.reason ?? "This looks like a small fix you can handle yourself.",
      workerType,
      diySteps: raw.diySteps ?? [],
      items: (raw.itemsNeeded ?? []).map((it) => ({
        name: it.item,
        priceInr: parseInrRange(it.price).min,
      })),
      timeMinutes: parseMinutes(raw.timeNeeded),
      costMin: cost.min,
      costMax: cost.max || cost.min,
      category: raw.category,
    };
  }

  const cost = parseInrRange(raw.estimatedCost);
  return {
    severity: "professional",
    problemName: raw.problemName ?? "Home repair",
    reason: raw.reason ?? "This needs a trained professional for safety.",
    workerType,
    diySteps: [],
    items: [],
    timeMinutes: parseMinutes(raw.timeRequired),
    costMin: cost.min,
    costMax: cost.max || cost.min,
    category: raw.category,
  };
}
