import { CheckCircle2, AlertTriangle, Wrench, ShoppingCart, Clock, Wallet, User } from "lucide-react";
import { useState } from "react";
import type { AnalysisResult } from "@/lib/ai.functions";
import { formatINR } from "@/lib/format";
import { useFirebaseWorkers } from "@/hooks/use-firebase-workers";
import { skillSlugToCategory } from "@/lib/workers.functions";
import { WorkerCard } from "./WorkerCard";
import { GoogleFallback } from "./GoogleFallback";
import { Skeleton } from "./ui/skeleton";

function WorkerSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
          <Skeleton className="mt-4 h-9 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

function MatchedWorkersSection({
  category,
  area,
  enabled,
}: {
  category: string;
  area?: string | null;
  enabled: boolean;
}) {
  const { workers, loading, error } = useFirebaseWorkers(enabled ? category : undefined, area);

  if (!enabled) return null;

  if (loading) {
    return (
      <div className="mt-6">
        <h4 className="mb-3 text-sm font-semibold text-primary">Matched Workers Near You</h4>
        <WorkerSkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <p className="mt-4 whitespace-pre-line rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        {error}
      </p>
    );
  }

  if (workers.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="mb-3 text-sm font-semibold text-primary">Matched Workers Near You</h4>
      <div className="grid gap-4 md:grid-cols-2">
        {workers.slice(0, 3).map((w) => (
          <WorkerCard key={w.id} worker={w} />
        ))}
      </div>
    </div>
  );
}

export function DiyResultCard({ result, city }: { result: AnalysisResult; city?: string | null }) {
  const [showWorkers, setShowWorkers] = useState(false);
  const category = result.category ?? skillSlugToCategory(result.workerType);

  return (
    <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-5 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary">Good news! You can fix this yourself.</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{result.reason}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Field icon={<Wrench className="h-4 w-4" />} label="Problem detected">
          <p className="text-base font-medium text-primary">{result.problemName}</p>
        </Field>

        <Field icon={<Wrench className="h-4 w-4" />} label="DIY Solution">
          <ol className="space-y-2">
            {result.diySteps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Field>

        {result.items.length > 0 && (
          <Field icon={<ShoppingCart className="h-4 w-4" />} label="Items needed">
            <ul className="space-y-1 text-sm">
              {result.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>• {it.name}</span>
                  <span className="font-medium text-primary">approx {formatINR(it.priceInr)}</span>
                </li>
              ))}
            </ul>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Stat icon={<Clock className="h-4 w-4" />} label="Time needed" value={`${result.timeMinutes} mins`} />
          <Stat icon={<Wallet className="h-4 w-4" />} label="Estimated cost" value={`${formatINR(result.costMin)} – ${formatINR(result.costMax)}`} />
        </div>
      </div>

      {!showWorkers && (
        <button
          onClick={() => setShowWorkers(true)}
          className="mt-5 text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          Still want a worker? →
        </button>
      )}

      <MatchedWorkersSection category={category} area={city} enabled={showWorkers} />
    </div>
  );
}

export function ProfessionalResultCard({ result, city }: { result: AnalysisResult; city?: string | null }) {
  const category = result.category ?? skillSlugToCategory(result.workerType);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3 bg-warning/15 px-5 py-4 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning text-warning-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">This needs a professional.</h3>
            <p className="text-sm text-muted-foreground">We've matched verified workers below.</p>
          </div>
        </div>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <Field icon={<Wrench className="h-4 w-4" />} label="Problem detected">
            <p className="text-base font-medium text-primary">{result.problemName}</p>
          </Field>
          <Field icon={<AlertTriangle className="h-4 w-4" />} label="Why professional needed">
            <p className="text-sm">{result.reason}</p>
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat icon={<Wallet className="h-4 w-4" />} label="Estimated cost" value={`${formatINR(result.costMin)} – ${formatINR(result.costMax)}`} />
            <Stat icon={<Clock className="h-4 w-4" />} label="Time required" value={`${result.timeMinutes} mins`} />
            <Stat icon={<User className="h-4 w-4" />} label="Worker needed" value={result.workerType.replace("-", " ")} />
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-primary">Matched Workers Near You</h3>
        <ProfessionalWorkersList category={category} area={city} />
        <GoogleFallback skill={result.workerType.replace("-", " ")} area={city ?? undefined} />
      </section>
    </div>
  );
}

function ProfessionalWorkersList({ category, area }: { category: string; area?: string | null }) {
  const { workers, loading, error } = useFirebaseWorkers(category, area);

  if (loading) return <WorkerSkeletonGrid />;

  if (error) {
    return (
      <p className="whitespace-pre-line rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        {error}
      </p>
    );
  }

  if (workers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        No verified workers in this category yet — see Google results below.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workers.slice(0, 3).map((w) => (
        <WorkerCard key={w.id} worker={w} />
      ))}
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1 text-sm font-semibold capitalize text-primary">{value}</p>
    </div>
  );
}
