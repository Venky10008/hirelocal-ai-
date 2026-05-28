import { Globe, Star } from "lucide-react";

export function GoogleFallback({ skill, area = "your city" }: { skill: string; area?: string }) {
  const results = [
    { name: `${skill} Service Center`, rating: 4.1, area },
    { name: `Quick ${skill} Help`, rating: 3.8, area },
  ];
  return (
    <section className="mt-8">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Globe className="h-4 w-4" /> Also found nearby on Google
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((r) => (
          <div
            key={r.name}
            className="rounded-xl border border-dashed border-border bg-muted/40 p-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">{r.name}</h4>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Unverified
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5" /> {r.rating}
              </span>
              <span>{r.area}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
