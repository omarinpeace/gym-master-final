import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckInButton } from "@/components/CheckInButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { generatePlan, getGymInsights } from "@/lib/ai.functions";
import { Sparkles, Flame, Target, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

type Workout = {
  id: string;
  name: string;
  focus: string | null;
  scheduled_date: string;
  completed: boolean;
};

function Dashboard() {
  const { user } = useAuth();
  const [todays, setTodays] = useState<Workout[]>([]);
  const [streak, setStreak] = useState(0);
  const [latestPlan, setLatestPlan] = useState<{
    summary: string | null;
    reasoning: string | null;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [insight, setInsight] = useState<{ skippedDay: string | null; message: string } | null>(
    null,
  );
  const generate = useServerFn(generatePlan);
  const fetchInsights = useServerFn(getGymInsights);

  const load = async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data: w } = await supabase
      .from("workouts")
      .select("id,name,focus,scheduled_date,completed")
      .eq("user_id", user.id)
      .eq("scheduled_date", today);
    setTodays(w ?? []);

    const { data: recent } = await supabase
      .from("workouts")
      .select("scheduled_date,completed")
      .eq("user_id", user.id)
      .eq("completed", true)
      .order("scheduled_date", { ascending: false })
      .limit(30);
    let s = 0;
    const dayMs = 86400000;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    const set = new Set((recent ?? []).map((r) => r.scheduled_date));
    while (set.has(cursor.toISOString().slice(0, 10))) {
      s++;
      cursor = new Date(cursor.getTime() - dayMs);
    }
    setStreak(s);

    const { data: p } = await supabase
      .from("plans")
      .select("summary,reasoning")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLatestPlan(p);

    try {
      const res = await fetchInsights();
      setInsight(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void load();
  }, [user]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { reasoning } = await generate();
      toast.success("New plan ready", { description: reasoning });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today</div>
          <h1 className="mt-1 font-serif text-5xl">
            {new Date().toLocaleDateString(undefined, { weekday: "long" })}.
          </h1>
        </div>
        <CheckInButton />
      </header>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Flame} label="Streak" value={`${streak} days`} />
        <StatCard icon={Target} label="Today's plan" value={`${todays.length} workouts`} />
        <StatCard
          icon={TrendingUp}
          label="Status"
          value={todays.every((t) => t.completed) && todays.length ? "Done" : "Pending"}
        />
      </div>

      {/* Insights Warning */}
      {insight?.skippedDay && (
        <div className="flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="text-sm font-medium">{insight.message}</div>
        </div>
      )}

      {/* Coach update */}
      <div className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, var(--lov-peach), var(--lov-pink))" }}
          >
            <Sparkles className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Coach update
            </div>
            <div className="font-serif text-lg">This week</div>
          </div>
        </div>
        <p className="mt-4 font-serif text-2xl leading-snug">
          {latestPlan?.summary ?? "No plan yet. Generate your first adaptive week."}
        </p>
        {latestPlan?.reasoning && (
          <p className="mt-2 text-sm text-muted-foreground">{latestPlan.reasoning}</p>
        )}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {generating ? "Generating…" : latestPlan ? "Regenerate plan" : "Generate my plan"}
        </button>
      </div>

      {/* Today's workouts */}
      <div>
        <h2 className="font-serif text-2xl">Today's workouts</h2>
        <div className="mt-4 grid gap-3">
          {todays.length === 0 && (
            <div className="rounded-2xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">
              Nothing scheduled today. Enjoy your rest day or generate a plan.
            </div>
          )}
          {todays.map((w) => (
            <Link
              key={w.id}
              to="/app/workouts/$id"
              params={{ id: w.id }}
              className="group flex items-center justify-between rounded-2xl border border-border bg-card/70 p-5 transition-all hover:shadow-md"
            >
              <div>
                <div className="font-serif text-xl">{w.name}</div>
                <div className="text-sm text-muted-foreground">{w.focus}</div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  w.completed ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                {w.completed ? "Done" : "Start"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-2xl">{value}</div>
    </div>
  );
}
