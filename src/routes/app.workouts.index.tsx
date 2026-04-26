import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/app/workouts/")({
  component: WorkoutsList,
});

type W = {
  id: string;
  name: string;
  focus: string | null;
  scheduled_date: string;
  completed: boolean;
};

function WorkoutsList() {
  const { user } = useAuth();
  const [items, setItems] = useState<W[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workouts")
      .select("id,name,focus,scheduled_date,completed")
      .eq("user_id", user.id)
      .order("scheduled_date", { ascending: true })
      .then(({ data }) => setItems(data ?? []));
  }, [user]);

  // Group by date
  const groups = items.reduce<Record<string, W[]>>((acc, w) => {
    (acc[w.scheduled_date] ??= []).push(w);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your week</div>
        <h1 className="mt-1 font-serif text-5xl">Workouts</h1>
      </header>

      {items.length === 0 && (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center text-muted-foreground">
          No workouts yet. Generate a plan from the dashboard.
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(groups).map(([date, list]) => (
          <div key={date}>
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {new Date(date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="grid gap-3">
              {list.map((w) => (
                <Link
                  key={w.id}
                  to="/app/workouts/$id"
                  params={{ id: w.id }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card/70 p-5 transition-all hover:shadow-md"
                >
                  <div>
                    <div className="font-serif text-xl">{w.name}</div>
                    <div className="text-sm text-muted-foreground">{w.focus}</div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      w.completed
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {w.completed ? "Done" : "Open"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
