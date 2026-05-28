import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Camera, Brain, Wrench, MessageCircle, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/data/categories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HireLocal AI — Describe or Photo Your Home Problem" },
      { name: "description", content: "AI analyzes your home problem instantly. Get a DIY guide or matched with verified local workers across India." },
      { property: "og:title", content: "HireLocal AI" },
      { property: "og:description", content: "AI-powered home services across India." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(800px 400px at 70% 20%, oklch(0.708 0.156 162 / 0.25), transparent 60%)" }} />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered home services
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-primary-foreground sm:text-6xl">
            Describe or Photo Your Problem
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-primary-foreground/75 sm:text-lg">
            AI analyzes it instantly — fix it yourself or we find you the right worker.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/analyze"
              search={{ mode: "text" } as never}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-accent-foreground shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl"
            >
              <MessageSquare className="h-5 w-5" /> Describe Problem
            </Link>
            <Link
              to="/analyze"
              search={{ mode: "photo" } as never}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-accent px-7 py-3.5 text-base font-semibold text-accent transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
            >
              <Camera className="h-5 w-5" /> Upload Photo
            </Link>
          </div>

          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to="/workers"
                search={{ skill: c.slug } as never}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-2 text-sm text-primary-foreground/90 transition-colors hover:border-accent/50 hover:bg-accent/10"
              >
                <span>{c.emoji}</span> {c.label}
              </Link>
            ))}
          </div>

          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 text-left sm:grid-cols-4">
            {[
              ["500+", "Workers"],
              ["10+", "Services"],
              ["AI", "Powered"],
              ["100%", "Free"],
            ].map(([k, v]) => (
              <div key={v} className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-3">
                <dt className="text-2xl font-bold text-accent">{k}</dt>
                <dd className="text-xs uppercase tracking-wide text-primary-foreground/70">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-primary sm:text-4xl">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Three steps. Two minutes. Zero forms.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: <MessageCircle className="h-6 w-6" />, title: "Describe or photograph", body: "Type or snap the problem in English, Hindi or Telugu." },
            { icon: <Brain className="h-6 w-6" />, title: "AI analyzes severity", body: "We instantly classify it as DIY or professional." },
            { icon: <Wrench className="h-6 w-6" />, title: "Get solution or worker", body: "Step-by-step guide or matched verified workers near you." },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">{s.icon}</div>
              <div className="mt-4 text-xs font-bold uppercase tracking-wider text-accent">Step {i + 1}</div>
              <h3 className="mt-1 text-lg font-semibold text-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
