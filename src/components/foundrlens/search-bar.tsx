import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialIdea?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  /** When provided, typing is reported live (controlled mode, e.g. explore filters). */
  onChange?: (value: string) => void;
  /** Set false on pages where submit should filter in place instead of navigating. */
  navigateOnSubmit?: boolean;
}

/**
 * Centered dark search surface. Enter or the arrow button submits the idea
 * and navigates to the analysis view.
 */
export function SearchBar({
  initialIdea = "",
  placeholder = "Describe your startup idea or search opportunities...",
  autoFocus = false,
  className,
  onChange,
  navigateOnSubmit = true,
}: SearchBarProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialIdea);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function updateValue(next: string) {
    setValue(next);
    onChange?.(next);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const idea = value.trim();
    if (!idea || !navigateOnSubmit) return;
    navigate({ to: "/analyze", search: { idea } });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-[10px] border border-input bg-card px-4 py-3",
          "transition-colors focus-within:border-primary/70",
          "shadow-[0_1px_0_0_oklch(1_0_0/0.03)]"
        )}
      >
        <Search className="size-4 shrink-0 text-tertiary" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => updateValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Startup idea or search query"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-tertiary"
        />
        <button
          type="submit"
          aria-label="Submit idea"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            "bg-secondary text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-foreground",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          )}
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}

export const navbarLinkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground";
