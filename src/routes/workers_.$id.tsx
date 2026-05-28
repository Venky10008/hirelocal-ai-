import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, MapPin, CheckCircle2, Phone, MessageCircle, Briefcase, Clock } from "lucide-react";
import { InitialsAvatar } from "@/components/Avatar";
import { workers as STATIC_WORKERS, type Worker } from "@/data/workers";
import { getWorkerById } from "@/lib/workers.functions";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/workers_/$id")({
  head: () => ({
    meta: [{ title: "Worker Profile — HireLocal AI" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-primary">Worker not found</h1>
      <Link to="/workers" className="mt-4 inline-block text-accent hover:underline">
        ← Back to all workers
      </Link>
    </div>
  ),
  component: WorkerProfilePage,
});

function WorkerProfilePage() {
  const { id } = Route.useParams();
  const loadWorker = useServerFn(getWorkerById);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const fromFirebase = await loadWorker({ data: { id } });
        if (cancelled) return;
        if (fromFirebase) {
          setWorker(fromFirebase);
        } else {
          const fallback = STATIC_WORKERS.find((w) => w.id === id);
          if (fallback) setWorker(fallback);
          else setNotFoundState(true);
        }
      } catch {
        const fallback = STATIC_WORKERS.find((w) => w.id === id);
        if (!cancelled) {
          if (fallback) setWorker(fallback);
          else setNotFoundState(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, loadWorker]);

  if (notFoundState) throw notFound();

  if (loading || !worker) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-48 w-full rounded-2xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link to="/workers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to workers
      </Link>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <InitialsAvatar name={worker.name} size={80} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary sm:text-3xl">{worker.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {worker.skill}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <CheckCircle2 className="h-3.5 w-3.5" /> HireLocal Verified
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-medium text-foreground">{worker.rating}</span> rating
              </span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> {worker.jobsDone} jobs done
              </span>
              <span>{worker.experienceYears} yrs experience</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {worker.area}, {worker.city}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h2 className="text-lg font-semibold text-primary">Services & Pricing</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="py-2.5">Service</th>
              <th className="py-2.5 text-right">Starting price</th>
            </tr>
          </thead>
          <tbody>
            {worker.services.map((s) => (
              <tr key={s.name} className="border-b border-border/60 last:border-0">
                <td className="py-3 text-foreground">{s.name}</td>
                <td className="py-3 text-right font-semibold text-primary">{s.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-accent/40 bg-accent/5 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-primary">What customers say</h2>
        <ul className="mt-3 space-y-2.5">
          {worker.reviews.length > 0 ? (
            worker.reviews.map((r) => (
              <li key={r.tag} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  <span className="font-medium text-foreground">"{r.tag}"</span>
                  <span className="text-muted-foreground"> — {r.count} customers</span>
                </span>
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">New on HireLocal — be the first to review.</li>
          )}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Clock className="h-5 w-5" /> Availability
        </h2>
        <p className="mt-2 text-sm text-foreground">{worker.schedule}</p>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a
          href={`tel:+${worker.phone}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-110 hover:shadow-md"
        >
          <Phone className="h-5 w-5" /> Call Now
        </a>
        <a
          href={`https://wa.me/${worker.phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-accent px-6 py-3.5 text-base font-semibold text-accent transition-all hover:bg-accent hover:text-accent-foreground"
        >
          <MessageCircle className="h-5 w-5" /> WhatsApp
        </a>
      </div>
    </main>
  );
}
