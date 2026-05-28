import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { WorkerCard } from "@/components/WorkerCard";
import { GoogleFallback } from "@/components/GoogleFallback";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/data/categories";
import { CITIES, type Worker } from "@/data/workers";
import { useCity } from "@/lib/city";
import { listAllWorkers } from "@/lib/workers.functions";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  skill: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/workers")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Browse Verified Workers Across India — HireLocal AI" },
      { name: "description", content: "Search verified electricians, plumbers, carpenters, painters, AC technicians and cleaners across India." },
    ],
  }),
  component: WorkersPage,
});

function norm(s: string) {
  return s.trim().toLowerCase();
}

function WorkersPage() {
  const { skill: initialSkill } = Route.useSearch();
  const fetchWorkers = useServerFn(listAllWorkers);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [skill, setSkill] = useState<string | "all">(initialSkill ?? "all");
  const [city, setCity] = useCity();
  const [cityInput, setCityInput] = useState(city ?? "");
  const [area, setArea] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          throw new Error("No internet connection. Please try again.");
        }
        const rows = await fetchWorkers();
        if (!cancelled) setAllWorkers(rows);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message ?? "Unable to load workers right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchWorkers]);

  // Areas available for the typed city (only show when a city is typed)
  const availableAreas = useMemo(() => {
    const c = norm(cityInput);
    if (!c) return [];
    const set = new Set<string>();
    allWorkers.forEach((w) => {
      if (norm(w.city) === c) set.add(w.area);
    });
    return Array.from(set).sort();
  }, [cityInput, allWorkers]);

  const filtered = useMemo(() => {
    const c = norm(cityInput);
    return allWorkers.filter((w) => {
      if (skill !== "all" && w.skillSlug !== skill) return false;
      if (c && norm(w.city) !== c) return false;
      if (area !== "all" && w.area !== area) return false;
      if (q.trim()) {
        const t = q.toLowerCase();
        if (
          !w.name.toLowerCase().includes(t) &&
          !w.area.toLowerCase().includes(t) &&
          !w.city.toLowerCase().includes(t)
        )
          return false;
      }
      return true;
    });
  }, [skill, cityInput, area, q, allWorkers]);

  function commitCity(value: string) {
    const trimmed = value.trim();
    setCityInput(trimmed);
    if (trimmed) setCity(trimmed.replace(/\b\w/g, (c) => c.toUpperCase()));
    setArea("all");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Browse Workers</h1>
        <p className="mt-2 text-muted-foreground">Verified local professionals across India.</p>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, area or city..."
              className="w-full rounded-full border border-input bg-card px-11 py-3 text-sm shadow-sm outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              list="city-suggestions"
              value={cityInput}
              onChange={(e) => commitCity(e.target.value)}
              placeholder="Type your city…"
              className="w-full rounded-full border border-input bg-card px-11 py-3 text-sm shadow-sm outline-none transition-colors focus:border-accent sm:w-56"
            />
            <datalist id="city-suggestions">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="relative">
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              disabled={!cityInput.trim()}
              className="rounded-full border border-input bg-card px-5 py-3 text-sm shadow-sm outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">
                {cityInput.trim() ? "All Areas" : "Type a city first"}
              </option>
              {availableAreas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPill active={skill === "all"} onClick={() => setSkill("all")} label="All" />
          {CATEGORIES.map((c) => (
            <FilterPill
              key={c.slug}
              active={skill === c.slug}
              onClick={() => setSkill(c.slug)}
              label={`${c.emoji} ${c.label}`}
            />
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "worker" : "workers"} found
        {cityInput.trim() ? ` in ${cityInput}` : " across India"}
      </p>

      {loading ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="mt-4 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
              <Skeleton className="mt-4 h-9 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-base font-medium text-primary">{loadError}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-base font-medium text-primary">No verified workers match your filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different city or category — or check Google results below.</p>
          <GoogleFallback skill={skill === "all" ? "service" : skill.replace("-", " ")} area={cityInput.trim() || undefined} />
        </div>
      )}
    </main>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200",
        active
          ? "border-accent bg-accent text-accent-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:border-accent/50 hover:bg-accent/5",
      )}
    >
      {label}
    </button>
  );
}
