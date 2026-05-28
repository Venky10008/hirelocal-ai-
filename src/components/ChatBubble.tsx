import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ChatBubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-md bg-accent text-accent-foreground"
            : "rounded-bl-md bg-card text-foreground border border-border",
        )}
      >
        {children}
      </div>
    </div>
  );
}
