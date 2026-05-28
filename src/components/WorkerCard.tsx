import { Link } from "@tanstack/react-router";
import { Star, MapPin, CheckCircle2 } from "lucide-react";
import { InitialsAvatar } from "./Avatar";
import type { Worker } from "@/data/workers";

export function WorkerCard({ worker }: { worker: Worker }) {
  const availDot = worker.availability === "available" ? "bg-accent" : "bg-warning";
  const availText = worker.availability === "available" ? "Available today" : "Available tomorrow";
  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex items-start gap-3">
        <InitialsAvatar name={worker.name} size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-primary">{worker.name}</h3>
          <span className="mt-1 inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            {worker.skill}
          </span>
        </div>
      </div>

      <div className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
        <CheckCircle2 className="h-3.5 w-3.5" /> HireLocal Verified
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="h-4 w-4 fill-warning text-warning" />
          <span className="font-medium text-foreground">{worker.rating}</span>
        </span>
        <span>{worker.experienceYears} yrs exp</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-4 w-4" /> {worker.area}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-semibold text-primary">{worker.price}</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${availDot}`} /> {availText}
        </span>
      </div>

      <Link
        to="/workers/$id"
        params={{ id: worker.id }}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
      >
        View Profile
      </Link>
    </article>
  );
}
