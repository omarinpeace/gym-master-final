import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

export function RestTimer({ seconds = 90 }: { seconds?: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (ref.current) window.clearInterval(ref.current);
          setRunning(false);
          if (typeof window !== "undefined" && "Audio" in window) {
            try {
              new Audio(
                "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgIA=",
              ).play();
            } catch {
              /* noop */
            }
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  const reset = () => {
    setRunning(false);
    setRemaining(seconds);
  };

  const m = Math.floor(remaining / 60);
  const s = String(remaining % 60).padStart(2, "0");
  const pct = (remaining / seconds) * 100;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="relative h-12 w-12">
        <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke="var(--muted)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            pathLength={100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-serif text-sm">
          {m}:{s}
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setRunning((v) => !v)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={reset}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
