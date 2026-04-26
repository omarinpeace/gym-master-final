import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

type Profile = {
  display_name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  sex: string | null;
  goal: string | null;
  experience_level: string | null;
  weekly_target_workouts: number | null;
  equipment: string[] | null;
};

type Severity = "mild" | "moderate" | "severe";
type Injury = {
  id: string;
  body_part: string;
  notes: string | null;
  active: boolean;
  severity: Severity;
};

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    height_cm: null,
    weight_kg: null,
    age: null,
    sex: null,
    goal: null,
    experience_level: null,
    weekly_target_workouts: 4,
    equipment: [],
  });
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [newInjury, setNewInjury] = useState<{
    body_part: string;
    notes: string;
    severity: Severity;
  }>({
    body_part: "",
    notes: "",
    severity: "moderate",
  });

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: inj }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("injuries").select("*").eq("user_id", user.id).eq("active", true),
    ]);
    if (p) setProfile(p);
    setInjuries((inj ?? []) as Injury[]);
  };

  useEffect(() => {
    void load();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  const addInjury = async () => {
    if (!user || !newInjury.body_part.trim()) return;
    const { data, error } = await supabase
      .from("injuries")
      .insert({
        user_id: user.id,
        body_part: newInjury.body_part,
        notes: newInjury.notes,
        severity: newInjury.severity,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setInjuries([...injuries, data as Injury]);
    setNewInjury({ body_part: "", notes: "", severity: "moderate" });
  };

  const removeInjury = async (id: string) => {
    await supabase.from("injuries").update({ active: false }).eq("id", id);
    setInjuries(injuries.filter((i) => i.id !== id));
  };

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your profile</div>
        <h1 className="mt-1 font-serif text-5xl">About you.</h1>
      </header>

      <div className="rounded-3xl border border-border bg-card/70 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={profile.display_name ?? ""}
              onChange={(e) => set("display_name", e.target.value)}
              className={inp}
            />
          </Field>
          <Field label="Age">
            <input
              type="number"
              value={profile.age ?? ""}
              onChange={(e) => set("age", e.target.value ? Number(e.target.value) : null)}
              className={inp}
            />
          </Field>
          <Field label="Height (cm)">
            <input
              type="number"
              value={profile.height_cm ?? ""}
              onChange={(e) => set("height_cm", e.target.value ? Number(e.target.value) : null)}
              className={inp}
            />
          </Field>
          <Field label="Weight (kg)">
            <input
              type="number"
              step="0.1"
              value={profile.weight_kg ?? ""}
              onChange={(e) => set("weight_kg", e.target.value ? Number(e.target.value) : null)}
              className={inp}
            />
          </Field>
          <Field label="Sex">
            <select
              value={profile.sex ?? ""}
              onChange={(e) => set("sex", e.target.value)}
              className={inp}
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Goal">
            <select
              value={profile.goal ?? ""}
              onChange={(e) => set("goal", e.target.value)}
              className={inp}
            >
              <option value="">—</option>
              <option value="lose_fat">Lose fat</option>
              <option value="build_muscle">Build muscle</option>
              <option value="recomp">Recomp</option>
              <option value="strength">Strength</option>
              <option value="maintain">Maintain</option>
            </select>
          </Field>
          <Field label="Experience">
            <select
              value={profile.experience_level ?? ""}
              onChange={(e) => set("experience_level", e.target.value)}
              className={inp}
            >
              <option value="">—</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </Field>
          <Field label="Weekly target workouts">
            <input
              type="number"
              min={1}
              max={7}
              value={profile.weekly_target_workouts ?? 4}
              onChange={(e) => set("weekly_target_workouts", Number(e.target.value))}
              className={inp}
            />
          </Field>
        </div>

        <div className="mt-6">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Available Equipment
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "Dumbbells",
              "Barbell",
              "Kettlebells",
              "Pull-up bar",
              "Resistance bands",
              "Bench",
              "Squat Rack",
              "Cable Machine",
              "Leg Press",
            ].map((item) => (
              <button
                key={item}
                onClick={() => {
                  const current = profile.equipment ?? [];
                  const next = current.includes(item)
                    ? current.filter((i) => i !== item)
                    : [...current, item];
                  set("equipment", next);
                }}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
                  profile.equipment?.includes(item)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          className="mt-6 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background"
        >
          Save profile
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card/70 p-6">
        <h2 className="font-serif text-2xl">Injuries</h2>
        <p className="text-sm text-muted-foreground">
          Tell us where it hurts and how bad. The coach will use lighter weights, swap exercises, or
          skip the muscle entirely based on severity.
        </p>
        <div className="mt-4 space-y-2">
          {injuries.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif">{i.body_part}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${severityClass(i.severity)}`}
                  >
                    {i.severity}
                  </span>
                </div>
                {i.notes && <div className="text-xs text-muted-foreground">{i.notes}</div>}
              </div>
              <button
                onClick={() => removeInjury(i.id)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input
            placeholder="Body part (e.g. lower back)"
            value={newInjury.body_part}
            onChange={(e) => setNewInjury({ ...newInjury, body_part: e.target.value })}
            className={inp}
          />
          <input
            placeholder="Notes (optional)"
            value={newInjury.notes}
            onChange={(e) => setNewInjury({ ...newInjury, notes: e.target.value })}
            className={inp}
          />
          <select
            value={newInjury.severity}
            onChange={(e) => setNewInjury({ ...newInjury, severity: e.target.value as Severity })}
            className={inp}
          >
            <option value="mild">Mild — lighter weights</option>
            <option value="moderate">Moderate — modify exercises</option>
            <option value="severe">Severe — avoid completely</option>
          </select>
          <button
            onClick={addInjury}
            className="flex items-center justify-center gap-1 rounded-xl bg-foreground px-4 text-sm text-background"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function severityClass(s: Severity) {
  if (s === "severe") return "bg-destructive/15 text-destructive";
  if (s === "moderate") return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}
