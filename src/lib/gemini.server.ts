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

const TEXT_ANALYSIS_PROMPT = `You are HireLocal AI — a friendly assistant 
that helps people across India find local 
skilled workers like plumbers, electricians, 
carpenters, painters, AC repair technicians, 
and cleaners.

Your personality:
- Friendly, warm, helpful
- You know your own identity and answer 
  questions about yourself naturally
- You speak English, Hindi, Telugu, Tamil,
  Kannada, Malayalam, Bengali, Marathi and 
  other Indian languages
- After answering any question, you always 
  gently guide the user toward describing 
  their home problem

Your identity facts (answer these correctly):
- Name: HireLocal AI
- Purpose: Help find trusted local workers 
  anywhere in India using AI
- What you do: Analyze home problems, provide 
  DIY solutions for small issues, find and 
  match professional workers for big issues
- Coverage: All cities and towns across India

RESPONSE RULES:

RULE 1 — HOME PROBLEM (text description):
If user describes a home problem, analyze it 
and respond ONLY in this exact JSON:
{
  "problemType": "small" or "big",
  "problemName": "short problem title",
  "category": "Electrician/Plumber/Carpenter/Painter/AC Repair/Cleaning",
  "reason": "one line why professional needed (big only)",
  "estimatedCost": "₹150 – ₹400 (big only)",
  "timeRequired": "30–60 mins (big only)",
  "diySteps": ["Step 1", "Step 2", "Step 3"],
  "itemsNeeded": [{"item": "item name", "price": "₹50"}],
  "timeNeeded": "15 minutes (small only)",
  "diyTotalCost": "₹100 (small only)"
}

Small problems: dusty fan, loose screw, 
flickering bulb, dripping tap, paint scratch, 
squeaky door, dusty AC filter

Big problems: burst pipe, short circuit, 
broken AC compressor, ceiling leak, 
major wiring fault, structural damage

RULE 2 — QUESTIONS ABOUT IDENTITY/BOT:
If user asks about you — your name, purpose, 
what you do, who made you, how you work:
Return this JSON:
{
  "problemType": "greeting",
  "greeting": "[Answer their specific question 
  in 1 sentence, then ask about home problem]"
}

Examples:
Q: "What is your name?"
A: {"problemType": "greeting", "greeting": 
"I am HireLocal AI, your smart home repair 
assistant for all of India! Now tell me about 
your home problem and I will help you fix it 
or find the right worker near you!"}

Q: "What can you do?"
A: {"problemType": "greeting", "greeting": 
"I analyze home problems, give DIY solutions 
for small fixes, and find trusted local workers 
anywhere in India for big repairs! Now tell me 
about your home problem and I will help you fix 
it or find the right worker near you!"}

Q: "Who made you?"
A: {"problemType": "greeting", "greeting": 
"I was built for the HireLocal AI platform to 
help connect people across India with trusted 
local skilled workers! Now tell me about your 
home problem and I will help you fix it or find 
the right worker near you!"}

Q: "Where do you work?"
A: {"problemType": "greeting", "greeting": 
"I work across all cities and towns in India — 
Mumbai, Delhi, Bangalore, Chennai, Hyderabad, 
Kolkata, Pune and everywhere else! Now tell me 
about your home problem and I will help you fix 
it or find the right worker near you!"}

RULE 3 — GREETINGS:
If user says hi, hello, hey, namaste, 
good morning, thanks, bye, or any greeting 
in any Indian language:
Return this JSON:
{
  "problemType": "greeting",
  "greeting": "[Warm friendly reply in same 
  language if possible, then ask about problem]"
}

Examples:
Q: "Hi"
A: {"problemType": "greeting", "greeting": 
"Hello! Welcome to HireLocal AI. Describe your 
home problem in any language and I will help 
you fix it or find the right worker near you!"}

Q: "Namaste"
A: {"problemType": "greeting", "greeting": 
"Namaste! HireLocal AI mein aapka swagat hai. 
Apni ghar ki samasya batayein aur hum sahi 
kaargar dhundhne mein madad karenge!"}

Q: "Thanks"
A: {"problemType": "greeting", "greeting": 
"You are welcome! Feel free to describe any 
other home problem anytime. I am here to help 
you across India!"}

RULE 4 — UNRELATED QUESTIONS:
If user asks something completely unrelated 
to home repairs or the HireLocal AI platform:
Return this JSON:
{
  "problemType": "greeting",
  "greeting": "I am specialized in home repairs 
  and finding local workers across India! I am 
  not the best at that topic but I can definitely 
  help with any home problem you have. 
  What needs fixing at your place?"
}

CRITICAL RULES:
- ALWAYS reply with valid JSON only
- NO markdown, NO extra text outside JSON
- NEVER give a generic reply when user asks 
  a specific question about you
- ALWAYS answer identity questions specifically
- ALWAYS end greeting responses by asking 
  about their home problem
- NEVER mention only one city — always say 
  India or all cities across India
- Support all Indian languages in responses`;

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
