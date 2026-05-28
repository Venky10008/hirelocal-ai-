import { Link } from "@tanstack/react-router";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <span aria-hidden>🔧</span>
          <span>HireLocal AI</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/workers"
            className="hidden text-sm font-medium text-foreground transition-colors hover:text-primary sm:inline"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            Browse Workers
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:brightness-110 hover:shadow-md"
          >
            Register as Worker
          </Link>
        </div>
      </nav>
    </header>
  );
}
