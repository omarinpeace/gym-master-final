import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RestTimer } from "@/components/RestTimer";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/workouts/$id")({
  component: WorkoutDetail,
});

type Workout = {
  id: string;
  name: string;
  focus: string | null;
  completed: boolean;
  scheduled_date: string;
};
type SetRow = {
  id: string;
  exercise_name: string;
  set_index: number;
  target_reps: number | null;
  reps: number | null;
  weight_kg: number | null;
  rest_seconds: number | null;
  completed: boolean;
};

function WorkoutDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [sets, setSets] = useState<SetRow[]>([]);

  const load = async () => {
    if (!user) return;
    const [{ data: w }, { data: s }] = await Promise.all([
      supabase.from("workouts").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("exercise_sets")
        .select("*")
        .eq("workout_id", id)
        .order("exercise_name")
        .order("set_index"),
    ]);
    setWorkout(w);
    setSets(s ?? []);
  };

  useEffect(() => {
    void load();
  }, [id, user]);

  const completeSet = async (setId: string, reps: number, weight: number) => {
    await supabase
      .from("exercise_sets")
      .update({ reps, weight_kg: weight, completed: true })
      .eq("id", setId);
    setSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, reps, weight_kg: weight, completed: true } : s)),
    );
  };

  const finishWorkout = async () => {
    await supabase
      .from("workouts")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", id);
    toast.success("Workout logged 🔥");
    setWorkout((w) => (w ? { ...w, completed: true } : w));
  };

  // Group sets by exercise
  const exercises = sets.reduce<Record<string, SetRow[]>>((acc, s) => {
    (acc[s.exercise_name] ??= []).push(s);
    return acc;
  }, {});

  if (!workout) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/app/workouts"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All workouts
      </Link>

      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {new Date(workout.scheduled_date).toLocaleDateString(undefined, { weekday: "long" })}
        </div>
        <h1 className="mt-1 font-serif text-5xl">{workout.name}</h1>
        <p className="mt-2 text-muted-foreground">{workout.focus}</p>
      </header>

      <div className="space-y-6">
        {Object.entries(exercises).map(([name, rows]) => (
          <div key={name} className="rounded-2xl border border-border bg-card/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">{name}</h2>
              <RestTimer seconds={rows[0]?.rest_seconds ?? 90} />
            </div>
            <div className="mt-4 space-y-2">
              {rows.map((s) => (
                <SetRowEditor key={s.id} row={s} onComplete={completeSet} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {!workout.completed && (
        <button
          onClick={finishWorkout}
          className="mt-8 w-full rounded-full bg-foreground py-3.5 text-sm font-medium text-background"
        >
          Finish workout
        </button>
      )}
    </div>
  );
}

function SetRowEditor({
  row,
  onComplete,
}: {
  row: SetRow;
  onComplete: (id: string, reps: number, weight: number) => void;
}) {
  const [reps, setReps] = useState<string>(
    row.reps?.toString() ?? row.target_reps?.toString() ?? "",
  );
  const [weight, setWeight] = useState<string>(row.weight_kg?.toString() ?? "");

  return (
    <div className="grid grid-cols-[40px_1fr_1fr_44px] items-center gap-2 rounded-xl bg-background/60 px-3 py-2">
      <div className="font-serif text-sm text-muted-foreground">#{row.set_index}</div>
      <input
        type="number"
        placeholder={`${row.target_reps ?? ""} reps`}
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <input
        type="number"
        step="0.5"
        placeholder="kg"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        onClick={() => onComplete(row.id, Number(reps) || 0, Number(weight) || 0)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          row.completed
            ? "bg-foreground text-background"
            : "border border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}
