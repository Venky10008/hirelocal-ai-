import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Camera, Send, Upload, X, Loader2, MessageSquare } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { ChatBubble } from "@/components/ChatBubble";
import { TypingDots } from "@/components/TypingDots";
import { DiyResultCard, ProfessionalResultCard } from "@/components/ResultCards";
import { analyzeProblem, type AnalysisResult } from "@/lib/ai.functions";
import { useCity } from "@/lib/city";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  mode: z.enum(["text", "photo"]).default("text").catch("text"),
});

export const Route = createFileRoute("/analyze")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "AI Problem Analysis — HireLocal AI" },
      { name: "description", content: "Describe or photograph your home problem and get an instant AI verdict — DIY guide or matched professional." },
    ],
  }),
  component: AnalyzePage,
});

type ChatMsg = { role: "user" | "assistant"; content: string; image?: string };

function AnalyzePage() {
  const { mode } = Route.useSearch();
  const navigate = Route.useNavigate();
  const analyze = useServerFn(analyzeProblem);
  const [city, setCity] = useCity();

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hi! Describe your home problem in any language — English, Hindi, or Telugu. I'll tell you if you can fix it yourself or if you need a professional.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [awaitingCity, setAwaitingCity] = useState(false);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function runAnalysis(text: string, image?: string) {
    setResult(null);
    setLoading(true);
    try {
      const res = await analyze({ data: { text: text || undefined, imageDataUrl: image } });
      if (res.severity === "greeting") {
        setResult(null);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: res.problemName },
        ]);
        return;
      }
      setResult(res);
      if (res.severity === "diy") {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Good news — you can fix this yourself. See guide below." },
        ]);
      } else {
        if (!city) {
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content:
                "This one needs a professional. Which city are you in? Type your city name (e.g. Hyderabad, Indore, Visakhapatnam) so I can match the right local worker.",
            },
          ]);
          setAwaitingCity(true);
        } else {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `This one needs a professional. See matched workers in ${city} below.` },
          ]);
        }
      }
    } catch (e: any) {
      const msg = e?.message ?? "AI analysis unavailable. Please try again.";
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(text: string, image?: string) {
    if (!text && !image) return;

    // If AI is waiting for a city, treat this message as a city answer.
    if (awaitingCity && text && !image) {
      const typedCity = text.trim().replace(/\b\w/g, (c) => c.toUpperCase());
      setMessages((m) => [
        ...m,
        { role: "user", content: text },
        { role: "assistant", content: `Got it — showing verified workers in ${typedCity} below. Scroll to view profiles.` },
      ]);
      setInput("");
      setCity(typedCity);
      setAwaitingCity(false);
      return;
    }

    setMessages((m) => [...m, { role: "user", content: text || "Analyze this photo", image }]);
    setInput("");
    await runAnalysis(text, image);
  }

  function onFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, HEIC)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Please use an image under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">AI Problem Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get a clear verdict in seconds.</p>
      </header>

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-full bg-muted p-1 shadow-inner">
        {([
          { id: "text", label: "Type Problem", icon: <MessageSquare className="h-4 w-4" /> },
          { id: "photo", label: "Upload Photo", icon: <Camera className="h-4 w-4" /> },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => {
              navigate({ search: { mode: t.id }, replace: true });
              if (t.id === "text") setImageDataUrl(null);
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
              mode === t.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        {mode === "photo" && (
          <PhotoMode
            imageDataUrl={imageDataUrl}
            setImageDataUrl={setImageDataUrl}
            loading={loading}
            onAnalyze={() => imageDataUrl && handleSubmit("", imageDataUrl)}
            onFile={onFile}
          />
        )}

        <div ref={scrollRef} className="max-h-[420px] min-h-[280px] space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role}>
              {m.image && (
                <img src={m.image} alt="user upload" className="mb-2 max-h-48 w-auto rounded-lg" />
              )}
              <span className="whitespace-pre-wrap">{m.content}</span>
            </ChatBubble>
          ))}
          {loading && (
            <ChatBubble role="assistant">
              <TypingDots />
            </ChatBubble>
          )}
        </div>

        <form
          className="flex items-center gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) handleSubmit(input.trim());
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={awaitingCity ? "Type your city name…" : "Describe your home problem…"}
            className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </form>
      </div>

      {result && result.severity !== "greeting" && !awaitingCity && (
        <section className="mt-8">
          {result.severity === "diy" ? (
            <DiyResultCard result={result} city={city} />
          ) : (
            <ProfessionalResultCard result={result} city={city} />
          )}
        </section>
      )}
    </main>
  );
}

function PhotoMode({
  imageDataUrl,
  setImageDataUrl,
  loading,
  onAnalyze,
  onFile,
}: {
  imageDataUrl: string | null;
  setImageDataUrl: (v: string | null) => void;
  loading: boolean;
  onAnalyze: () => void;
  onFile: (f: File) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      {!imageDataUrl ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-16 text-center transition-colors hover:border-accent hover:bg-accent/5">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-base font-semibold text-primary">Upload photo of your problem</p>
            <p className="mt-1 text-sm text-muted-foreground">Tap to take photo or choose from gallery</p>
            <p className="mt-1 text-xs text-muted-foreground">Supports JPG, PNG, HEIC</p>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
      ) : (
        <div>
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img src={imageDataUrl} alt="Problem preview" className="max-h-[420px] w-full object-contain bg-muted" />
            <button
              type="button"
              onClick={() => setImageDataUrl(null)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onAnalyze}
            disabled={loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>Analyze This Problem</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
