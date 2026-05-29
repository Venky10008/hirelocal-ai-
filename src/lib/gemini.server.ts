export type GeminiRawAnalysis = {
  problemType?: string;
  problemName?: string;
  category?: string;
  reason?: string;
  estimatedCost?: string;
  timeRequired?: string;
  diySteps?: string[];
  itemsNeeded?: { item: string; price: string }[];
  timeNeeded?: string;
  diyTotalCost?: string;
  greeting?: string;
};

export type GeminiRawWorkerProfile = {
  name: string;
  skill: string;
  area: string;
  experience: string;
  phone: string;
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.3-70b-versatile",
];

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing");
  return key;
}

export function parseGeminiJson<T>(text: string): T {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) cleaned = jsonMatch[0]!;
  return JSON.parse(cleaned) as T;
}

async function callGroq(
  messages: { role: string; content: any }[],
  model?: string,
): Promise<string> {
  const apiKey = getApiKey();
  const modelsToTry = model ? [model] : MODELS;
  const errors: string[] = [];

  for (const m of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model: m, messages, temperature: 0.2, max_tokens: 2048 }),
        });

        const json = await res.json();

        if (res.ok) {
          const text = json?.choices?.[0]?.message?.content;
          if (text) return text;
          errors.push(`${m}: empty response`);
        } else {
          const msg = json?.error?.message || json?.error || `error ${res.status}`;
          errors.push(`${m}: ${msg}`);
          if (res.status === 429) {
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          break;
        }
      } catch (fetchErr) {
        errors.push(`${m}: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
        break;
      }
    }
  }

  throw new Error(errors.join(" | "));
}

const TEXT_ANALYSIS_PROMPT = `You are HireLocal AI assistant. A user described a home problem. Analyze it and respond ONLY in valid JSON format.

{
"problemType": "small or big",
"problemName": "short problem title",
"category": "Electrician/Plumber/Carpenter/Painter/AC Repair/Cleaning",
"reason": "one line why professional needed",
"estimatedCost": "₹150 – ₹400",
"timeRequired": "30–60 mins",
"diySteps": ["Step 1", "Step 2", "Step 3"],
"itemsNeeded": [{"item": "item name", "price": "₹50"}],
"timeNeeded": "15 minutes",
"diyTotalCost": "₹100"
}

Rules:
1. Small problems: dusty fan, loose screw, flickering bulb, dripping tap, paint scratch, squeaky door
2. Big problems: burst pipe, short circuit, broken AC, ceiling leak, major wiring, structural damage
3. If problemType is 'small': include diySteps, itemsNeeded, timeNeeded, diyTotalCost
4. If problemType is 'big': include reason, estimatedCost, timeRequired

5. If the user sent a greeting, casual question, chit-chat (e.g. "hi", "hello", "what is your name", "how are you", "who are you", "what can you do", "thanks", "bye") — NOT a home problem:
   Return: {"problemType": "greeting", "greeting": "Your short friendly reply (under 20 words) asking them to describe their home problem."}

6. Reply ONLY with JSON. No markdown. No explanation.`;

export async function analyzeTextWithGemini(userText: string): Promise<GeminiRawAnalysis> {
  const raw = await callGroq([
    { role: "system", content: TEXT_ANALYSIS_PROMPT },
    { role: "user", content: `User problem description:\n${userText}` },
  ], "llama-3.3-70b-versatile");
  return parseGeminiJson<GeminiRawAnalysis>(raw);
}

export async function analyzeImageWithGemini(
  base64: string,
  mimeType: string,
): Promise<GeminiRawAnalysis> {
  const raw = await callGroq([
    { role: "system", content: `${TEXT_ANALYSIS_PROMPT}\n\nAnalyze this home problem image and return ONLY valid JSON in the required format.` },
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze this home problem image." },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
    },
  ], "meta-llama/llama-4-scout-17b-16e-instruct");
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
  const raw = await callGroq([
    { role: "system", content: WORKER_EXTRACT_PROMPT },
    { role: "user", content: message },
  ], "llama-3.3-70b-versatile");
  return parseGeminiJson<GeminiRawWorkerProfile>(raw);
}

export async function registrationChatWithGemini(
  transcript: string,
  missing: string[],
): Promise<string> {
  const raw = await callGroq([
    {
      role: "system",
      content: `You are a friendly HireLocal registration assistant. Ask only for the missing fields: ${missing.join(", ") || "none"}. Keep replies under 30 words. Match the worker's language (English, Hindi, or Telugu). Reply with plain text only, no JSON.`,
    },
    { role: "user", content: transcript },
  ], "llama-3.3-70b-versatile");
  return raw.trim();
}
