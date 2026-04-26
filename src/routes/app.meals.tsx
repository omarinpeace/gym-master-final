import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { generateMeals } from "@/lib/ai.functions";
import { Sparkles, Utensils } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/meals")({
  component: MealsPage,
});

type Meal = {
  id: string;
  meal_type: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  cost_egp: number | null;
};

function MealsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goal, setGoal] = useState<"cheap_bulk" | "cheap_cut" | "balanced">("cheap_bulk");
  const [budget, setBudget] = useState(80);
  const [loading, setLoading] = useState(false);

  const gen = useServerFn(generateMeals);

  const load = async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today);
    setMeals(data ?? []);
  };

  useEffect(() => {
    void load();
  }, [user]);

  const generate = async () => {
    setLoading(true);
    try {
      await gen({ data: { goal, budget_egp_per_day: budget } });
      toast.success("Today's meals ready");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const totals = meals.reduce(
    (acc, m) => ({
      cal: acc.cal + (m.calories ?? 0),
      p: acc.p + (m.protein_g ?? 0),
      c: acc.c + (m.carbs_g ?? 0),
      f: acc.f + (m.fat_g ?? 0),
      cost: acc.cost + (m.cost_egp ?? 0),
    }),
    { cal: 0, p: 0, c: 0, f: 0, cost: 0 },
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Local meal planner
        </div>
        <h1 className="mt-1 font-serif text-5xl">Today's meals</h1>
      </header>

      <div className="rounded-3xl border border-border bg-card/70 p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as typeof goal)}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
          >
            <option value="cheap_bulk">Cheap bulk</option>
            <option value="cheap_cut">Cheap cut</option>
            <option value="balanced">Balanced</option>
          </select>
          <input
            type="number"
            min={30}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            placeholder="Budget EGP/day"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
          />
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "…" : "Plan day"}
          </button>
        </div>
      </div>

      {meals.length > 0 && (
        <div className="grid gap-2 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-5">
          <Stat label="Calories" value={Math.round(totals.cal)} />
          <Stat label="Protein" value={`${Math.round(totals.p)}g`} />
          <Stat label="Carbs" value={`${Math.round(totals.c)}g`} />
          <Stat label="Fat" value={`${Math.round(totals.f)}g`} />
          <Stat label="Price" value={`${Math.round(totals.cost)}`} target={budget} />
        </div>
      )}

      <div className="space-y-3">
        {meals.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-2xl border border-border bg-card/70">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <Utensils className="h-3 w-3" />
                    {m.meal_type}
                  </div>
                  <div className="mt-1 font-serif text-2xl">{m.name}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{Math.round(m.calories ?? 0)} kcal</span>
                <span>· {Math.round(m.protein_g ?? 0)}g protein</span>
                <span>· {Math.round(m.carbs_g ?? 0)}g carbs</span>
                <span>· {Math.round(m.fat_g ?? 0)}g fat</span>
                {m.cost_egp != null ? <span>· {Math.round(m.cost_egp)} EGP</span> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  target,
}: {
  label: string;
  value: string | number;
  target?: string | number | null;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-1">
        <div className="font-serif text-lg">{value}</div>
        {target && <div className="text-[10px] text-muted-foreground">/ {target}</div>}
      </div>
    </div>
  );
}
