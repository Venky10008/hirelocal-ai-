const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type GeminiRawAnalysis = {
  problemType: "small" | "big";
  problemName: string;
  category: string;
  reason?: string;
  estimatedCost?: string;
  timeRequired?: string;
  diySteps?: string[];
  itemsNeeded?: { item: string; price: string }[];
  timeNeeded?: string;
  diyTotalCost?: string;
};

export type GeminiRawWorkerProfile = {
  name: string;
  skill: string;
  area: string;
  experience: string;
  phone: string;
};

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  return key;
}

export function parseGeminiJson<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

async function callGemini(parts: { text?: string; inlineData?: { mimeType: string; data: string } }[]) {
  const apiKey = getApiKey();
  const body = {
    contents: [
      {
        parts: parts.map((p) => {
          if (p.inlineData) {
            return {
              inline_data: {
                mime_type: p.inlineData.mimeType,
                data: p.inlineData.data,
              },
            };
          }
          return { text: p.text ?? "" };
        }),
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  console.log("[Gemini] response:", JSON.stringify(json, null, 2));

  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Gemini API error ${res.status}`);
  }

  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

const TEXT_ANALYSIS_PROMPT = `You are HireLocal AI assistant.

A user described a home problem.

Analyze it and respond ONLY in valid JSON format.

Required JSON structure:

{
"problemType": "small or big",
"problemName": "short problem title",
"category": "Electrician/Plumber/Carpenter/Painter/AC Repair/Cleaning",
"reason": "one line why professional needed",
"estimatedCost": "₹150 – ₹400",
"timeRequired": "30–60 mins",
"diySteps": [
"Step 1",
"Step 2",
"Step 3"
],
"itemsNeeded": [
{
"item": "item name",
"price": "₹50"
}
],
"timeNeeded": "15 minutes",
"diyTotalCost": "₹100"
}

Rules:

1. Small problems:

* dusty fan
* loose screw
* flickering bulb
* dripping tap
* paint scratch
* squeaky door

2. Big problems:

* burst pipe
* short circuit
* broken AC
* ceiling leak
* major wiring
* structural damage

3. If problemType is 'small':

* include diySteps
* include itemsNeeded
* include timeNeeded
* include diyTotalCost

4. If problemType is 'big':

* include reason
* include estimatedCost
* include timeRequired

5. Reply ONLY with JSON.
   No markdown.
   No explanation.`;

const IMAGE_ANALYSIS_PROMPT =
  "Analyze this home problem image and return ONLY valid JSON in the required format.";

export async function analyzeTextWithGemini(userText: string): Promise<GeminiRawAnalysis> {
  const raw = await callGemini([
    { text: TEXT_ANALYSIS_PROMPT },
    { text: `User problem description:\n${userText}` },
  ]);
  return parseGeminiJson<GeminiRawAnalysis>(raw);
}

export async function analyzeImageWithGemini(
  base64: string,
  mimeType: string,
): Promise<GeminiRawAnalysis> {
  const raw = await callGemini([
    { text: `${TEXT_ANALYSIS_PROMPT}\n\n${IMAGE_ANALYSIS_PROMPT}` },
    { inlineData: { mimeType, data: base64 } },
  ]);
  return parseGeminiJson<GeminiRawAnalysis>(raw);
}

const WORKER_EXTRACT_PROMPT = `Extract worker details from this message and return ONLY JSON:

{
"name": "",
"skill": "",
"area": "",
"experience": "",
"phone": ""
}`;

export async function extractWorkerWithGemini(message: string): Promise<GeminiRawWorkerProfile> {
  const raw = await callGemini([
    { text: WORKER_EXTRACT_PROMPT },
    { text: message },
  ]);
  return parseGeminiJson<GeminiRawWorkerProfile>(raw);
}

export async function registrationChatWithGemini(
  transcript: string,
  missing: string[],
): Promise<string> {
  const raw = await callGemini([
    {
      text: `You are a friendly HireLocal registration assistant. Ask only for the missing fields: ${missing.join(", ") || "none"}. Keep replies under 30 words. Match the worker's language (English, Hindi, or Telugu). Reply with plain text only, no JSON.`,
    },
    { text: transcript },
  ]);
  return raw.trim();
}
