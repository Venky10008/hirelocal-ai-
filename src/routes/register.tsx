import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Send, CheckCircle2, Users, BadgeCheck, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ChatBubble } from "@/components/ChatBubble";
import { TypingDots } from "@/components/TypingDots";
import { InitialsAvatar } from "@/components/Avatar";
import {
  extractWorkerProfile,
  registrationReply,
  type WorkerProfileDraft,
} from "@/lib/ai.functions";
import { saveWorker } from "@/lib/workers.functions";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register as a Worker — HireLocal AI" },
      { name: "description", content: "Join HireLocal AI and get free customers. No app download, no forms. Just chat with our AI assistant in English, Hindi or Telugu." },
    ],
  }),
  component: RegisterPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function RegisterPage() {
  const extract = useServerFn(extractWorkerProfile);
  const reply = useServerFn(registrationReply);
  const persistWorker = useServerFn(saveWorker);
  const [saving, setSaving] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hello! I will create your profile in 2 minutes. Just tell me:\n• Your name\n• Your skill (electrician, plumber etc.)\n• Your area/city\n• Years of experience\n• Your phone number\n\nYou can type in English, Hindi, or Telugu!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<WorkerProfileDraft | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [editing, setEditing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function transcript(msgs: Msg[]) {
    return msgs.map((m) => `${m.role === "user" ? "Worker" : "Assistant"}: ${m.content}`).join("\n");
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const profile = await extract({ data: { transcript: transcript(next) } });
      if (profile.complete) {
        setDraft(profile);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Great — I have everything I need. Please review your profile below." },
        ]);
      } else {
        const aiMsg = await reply({
          data: { transcript: transcript(next), missing: profile.missing },
        });
        setMessages((m) => [...m, { role: "assistant", content: aiMsg }]);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (confirmed && draft) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-primary">🎉 Profile Created!</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Customers in <span className="font-semibold text-foreground">{draft.area}</span> can now find you on HireLocal AI.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Join HireLocal AI — Get Free Customers
        </h1>
        <p className="mt-2 text-muted-foreground">
          No app download. No forms. Just tell us about yourself.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Benefit icon={<Gift className="h-5 w-5" />} title="Completely Free" />
        <Benefit icon={<Users className="h-5 w-5" />} title="Real Customers" />
        <Benefit icon={<BadgeCheck className="h-5 w-5" />} title="Verified Badge" />
      </div>

      {/* Chat */}
      <div className="mt-8 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" /> AI Registration Assistant
        </div>
        <div ref={scrollRef} className="max-h-[420px] min-h-[280px] space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role}>
              <span className="whitespace-pre-wrap">{m.content}</span>
            </ChatBubble>
          ))}
          {loading && (
            <ChatBubble role="assistant">
              <TypingDots />
            </ChatBubble>
          )}
        </div>
        {!draft || editing ? (
          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              setEditing(false);
              send(input.trim());
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer…"
              className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        ) : null}
      </div>

      {/* Preview */}
      {draft && !editing && (
        <section className="mt-6 rounded-2xl border-2 border-accent/40 bg-accent/5 p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-primary">Profile Preview</h2>
          <div className="mt-4 flex items-start gap-4">
            <InitialsAvatar name={draft.name || "?"} size={64} />
            <div className="flex-1 space-y-1.5 text-sm">
              <Row label="Name" value={draft.name} />
              <Row label="Skill" value={draft.skill} />
              <Row label="Area" value={draft.area} />
              <Row label="Experience" value={`${draft.experienceYears} years`} />
              <Row label="Phone" value={draft.phone} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              disabled={saving}
              onClick={async () => {
                if (!draft) return;
                setSaving(true);
                try {
                  if (typeof navigator !== "undefined" && !navigator.onLine) {
                    throw new Error("No internet connection. Please try again.");
                  }
                  await persistWorker({
                    data: {
                      name: draft.name,
                      skill: draft.skill,
                      area: draft.area,
                      experience: draft.experienceYears,
                      phone: draft.phone,
                    },
                  });
                  setConfirmed(true);
                } catch (e: any) {
                  toast.error(e?.message ?? "Unable to save profile right now.");
                } finally {
                  setSaving(false);
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Creating…" : "✅ Yes, Create My Profile"}
            </button>
            <button
              onClick={() => {
                setEditing(true);
                setDraft(null);
                setMessages((m) => [
                  ...m,
                  { role: "assistant", content: "No problem — what would you like to change?" },
                ]);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary px-5 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            >
              ✏️ Edit Details
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function Benefit({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
        {icon}
      </div>
      <span className="text-sm font-medium text-primary">{title}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}
