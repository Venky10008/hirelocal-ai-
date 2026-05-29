import { createServerFn } from "@tanstack/react-start";
import { mapGeminiToAnalysisResult } from "@/lib/analysis-mapper";
import {
  analyzeImageWithGemini,
  analyzeTextWithGemini,
  extractWorkerWithGemini,
  registrationChatWithGemini,
} from "@/lib/gemini.server";

export type AnalysisResult = {
  severity: "diy" | "professional" | "greeting";
  problemName: string;
  reason: string;
  workerType: string;
  category?: string;
  diySteps: string[];
  items: { name: string; priceInr: number }[];
  timeMinutes: number;
  costMin: number;
  costMax: number;
};

export type WorkerProfileDraft = {
  name: string;
  skill: string;
  area: string;
  experienceYears: number;
  phone: string;
  complete: boolean;
  missing: string[];
};

function isOfflineError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /network|fetch failed|failed to fetch|offline/i.test(msg);
}

function parseImageDataUrl(imageDataUrl: string): { base64: string; mimeType: string } {
  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data");
  return { mimeType: match[1]!, base64: match[2]! };
}

export const analyzeProblem = createServerFn({ method: "POST" })
  .inputValidator((d: { text?: string; imageDataUrl?: string; imageBase64?: string; mimeType?: string }) => d)
  .handler(async ({ data }): Promise<AnalysisResult> => {
    try {
      let raw;
      if (data.imageBase64 && data.mimeType) {
        raw = await analyzeImageWithGemini(data.imageBase64, data.mimeType);
      } else if (data.imageDataUrl) {
        const { base64, mimeType } = parseImageDataUrl(data.imageDataUrl);
        raw = await analyzeImageWithGemini(base64, mimeType);
      } else if (data.text?.trim()) {
        raw = await analyzeTextWithGemini(data.text.trim());
      } else {
        throw new Error("Provide text or an image.");
      }

      if (raw.problemType === "greeting") {
        return {
          severity: "greeting",
          problemName: raw.greeting || "Hi! Describe your home problem in any language — English, Hindi, or Telugu.",
          reason: "",
          workerType: "",
          diySteps: [],
          items: [],
          timeMinutes: 0,
          costMin: 0,
          costMax: 0,
        };
      }

      return mapGeminiToAnalysisResult(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[analyzeProblem]", msg);
      if (isOfflineError(err)) throw new Error("No internet connection. Please try again.");
      throw new Error(msg || "AI analysis unavailable. Please try again.");
    }
  });

function buildWorkerDraft(raw: {
  name: string;
  skill: string;
  area: string;
  experience: string;
  phone: string;
}): WorkerProfileDraft {
  const experienceYears = Number.parseInt(String(raw.experience).replace(/\D/g, ""), 10) || 0;
  const draft = {
    name: (raw.name ?? "").trim(),
    skill: (raw.skill ?? "").trim(),
    area: (raw.area ?? "").trim(),
    experienceYears,
    phone: (raw.phone ?? "").replace(/\D/g, "").slice(-10),
  };
  const missing: string[] = [];
  if (!draft.name) missing.push("name");
  if (!draft.skill) missing.push("skill");
  if (!draft.area) missing.push("area");
  if (!draft.experienceYears) missing.push("experience");
  if (!draft.phone || draft.phone.length < 10) missing.push("phone");
  return { ...draft, complete: missing.length === 0, missing };
}

export const extractWorkerProfile = createServerFn({ method: "POST" })
  .inputValidator((d: { transcript: string }) => d)
  .handler(async ({ data }): Promise<WorkerProfileDraft> => {
    try {
      const raw = await extractWorkerWithGemini(data.transcript);
      return buildWorkerDraft(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[extractWorkerProfile]", msg);
      if (isOfflineError(err)) throw new Error("No internet connection. Please try again.");
      throw new Error(msg || "AI analysis unavailable. Please try again.");
    }
  });

export const registrationReply = createServerFn({ method: "POST" })
  .inputValidator((d: { transcript: string; missing: string[] }) => d)
  .handler(async ({ data }): Promise<string> => {
    try {
      return await registrationChatWithGemini(data.transcript, data.missing);
    } catch {
      return "Could you tell me more?";
    }
  });
