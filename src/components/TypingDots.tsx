export function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      <span className="dot-bounce h-2 w-2 rounded-full bg-muted-foreground/60" style={{ animationDelay: "0s" }} />
      <span className="dot-bounce h-2 w-2 rounded-full bg-muted-foreground/60" style={{ animationDelay: "0.15s" }} />
      <span className="dot-bounce h-2 w-2 rounded-full bg-muted-foreground/60" style={{ animationDelay: "0.3s" }} />
    </div>
  );
}
