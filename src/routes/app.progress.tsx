import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TrendingUp, Scale, Activity, Plus, Camera, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});

type Stats = {
  completed30: number;
  consistency: number;
  totalVolume: number;
  bestLift: { name: string; weight: number };
  gymSessions: number;
  gymMinutes: number;
  uniqueDays: number;
};

type InBodyScan = {
  id: string;
  created_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
};

type ProgressPhoto = {
  id: string;
  image_url: string;
  label: string | null;
  created_at: string;
};

function ProgressPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    completed30: 0,
    consistency: 0,
    totalVolume: 0,
    bestLift: { name: "", weight: 0 },
    gymSessions: 0,
    gymMinutes: 0,
    uniqueDays: 0,
  });
  const [insight, setInsight] = useState<string>("");
  const [scans, setScans] = useState<InBodyScan[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!user) return;
    const sinceDate = new Date(Date.now() - 30 * 86400000);
    const since = sinceDate.toISOString().slice(0, 10);
    const sinceISO = sinceDate.toISOString();

    const [
      { data: workouts },
      { data: sets },
      { data: checkins },
      { data: inbody },
      { data: photoData },
    ] = await Promise.all([
      supabase
        .from("workouts")
        .select("id,completed,scheduled_date")
        .eq("user_id", user.id)
        .gte("scheduled_date", since),
      supabase
        .from("exercise_sets")
        .select("exercise_name,reps,weight_kg")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("created_at", sinceISO),
      supabase
        .from("checkins")
        .select("started_at,ended_at")
        .eq("user_id", user.id)
        .gte("started_at", sinceISO),
      supabase
        .from("inbody_scans")
        .select("id,created_at,weight_kg,body_fat_pct,muscle_mass_kg")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setScans(inbody ?? []);
    setPhotos(photoData ?? []);

    const total = workouts?.length ?? 0;
    const completed = workouts?.filter((w) => w.completed).length ?? 0;
    const consistency = total ? Math.round((completed / total) * 100) : 0;
    const totalVolume = (sets ?? []).reduce(
      (acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0),
      0,
    );
    let best = { name: "", weight: 0 };
    for (const s of sets ?? []) {
      if ((s.weight_kg ?? 0) > best.weight) {
        best = { name: s.exercise_name, weight: s.weight_kg ?? 0 };
      }
    }

    // Gym check-in stats
    const gymSessions = checkins?.length ?? 0;
    const now = Date.now();
    const gymMinutes = Math.round(
      (checkins ?? []).reduce((acc, c) => {
        const start = new Date(c.started_at).getTime();
        const end = c.ended_at ? new Date(c.ended_at).getTime() : now;
        return acc + Math.max(0, end - start) / 60000;
      }, 0),
    );
    const dayKeys = new Set(
      (checkins ?? []).map((c) => new Date(c.started_at).toISOString().slice(0, 10)),
    );
    const uniqueDays = dayKeys.size;

    setStats({
      completed30: completed,
      consistency,
      totalVolume,
      bestLift: best,
      gymSessions,
      gymMinutes,
      uniqueDays,
    });

    if (gymSessions === 0 && total === 0) {
      setInsight("No data yet. Check into the gym or generate a plan to start tracking.");
    } else if (consistency >= 80 || uniqueDays >= 16) {
      setInsight("You're very consistent this month — keep it up.");
    } else if (consistency >= 50 || uniqueDays >= 10) {
      setInsight("Decent rhythm. One more session a week unlocks faster results.");
    } else if (gymSessions > 0 && completed === 0) {
      setInsight(
        `You've been to the gym ${gymSessions} time${gymSessions === 1 ? "" : "s"} but haven't logged sets — log your lifts to track real progress.`,
      );
    } else {
      setInsight("You're improving slower than expected — let's find a schedule that fits.");
    }
  };

  useEffect(() => {
    void load();
  }, [user]);

  // Live-refresh when a check-in is created/updated so progress stays accurate.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`progress-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exercise_sets", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workouts", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("progress").upload(path, file);
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("progress").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("progress_photos").insert({
        user_id: user.id,
        image_url: publicUrl,
        label: "Progress Photo",
      });
      if (dbErr) throw dbErr;

      toast.success("Photo added!");
      void load();
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (id: string, url: string) => {
    if (!confirm("Delete this photo?")) return;
    try {
      const path = url.split("/progress/")[1];
      await supabase.storage.from("progress").remove([path]);
      await supabase.from("progress_photos").delete().eq("id", id);
      toast.success("Deleted");
      void load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const latestScan = scans[0];
  const prevScan = scans[1];

  const diff = (key: keyof InBodyScan) => {
    if (!latestScan || !prevScan) return null;
    const v1 = latestScan[key] as number;
    const v2 = prevScan[key] as number;
    if (v1 === null || v2 === null) return null;
    const d = v1 - v2;
    return {
      value: Math.abs(d).toFixed(1),
      positive: d > 0,
      label: d > 0 ? "Up" : "Down",
    };
  };

  const hours = Math.floor(stats.gymMinutes / 60);
  const minutes = stats.gymMinutes % 60;
  const gymTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Last 30 days</div>
        <h1 className="mt-1 font-serif text-5xl">Progress</h1>
      </header>

      <div className="rounded-3xl border border-border bg-card/70 p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Insight</div>
        <p className="mt-2 font-serif text-2xl leading-snug">{insight}</p>
      </div>

      <section>
        <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
          InBody Comparison
        </h2>
        {!latestScan ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No scans found. Upload your first InBody scan to see trends.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <ComparisonCard
              label="Weight"
              value={`${latestScan.weight_kg}kg`}
              diff={diff("weight_kg")}
              unit="kg"
            />
            <ComparisonCard
              label="Body Fat"
              value={`${latestScan.body_fat_pct}%`}
              diff={diff("body_fat_pct")}
              unit="%"
              invertColor
            />
            <ComparisonCard
              label="Muscle Mass"
              value={`${latestScan.muscle_mass_kg}kg`}
              diff={diff("muscle_mass_kg")}
              unit="kg"
            />
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Progress Photos
          </h2>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-transform hover:scale-105">
            <Camera className="h-3.5 w-3.5" />
            {uploading ? "…" : "Add photo"}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {photos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Camera className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Track your physical transformation here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card"
              >
                <img
                  src={p.image_url}
                  alt="Progress"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="text-[10px] text-white/80">
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => deletePhoto(p.id, p.image_url)}
                    className="rounded-lg bg-red-500/20 p-1.5 text-red-200 backdrop-blur-sm hover:bg-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
          Gym attendance
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Gym sessions" value={stats.gymSessions} />
          <Stat label="Time at the gym" value={gymTime} />
          <Stat label="Days trained" value={`${stats.uniqueDays} / 30`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Training</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Workouts done" value={stats.completed30} />
          <Stat label="Consistency" value={`${stats.consistency}%`} />
          <Stat label="Total volume" value={`${Math.round(stats.totalVolume)} kg`} />
          <Stat
            label="Best lift"
            value={stats.bestLift.name ? `${stats.bestLift.weight}kg` : "—"}
            sub={stats.bestLift.name}
          />
        </div>
      </section>
    </div>
  );
}

function ComparisonCard({
  label,
  value,
  diff,
  unit,
  invertColor = false,
}: {
  label: string;
  value: string;
  diff: { value: string; positive: boolean; label: string } | null;
  unit: string;
  invertColor?: boolean;
}) {
  const isGood = invertColor ? !diff?.positive : diff?.positive;
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="font-serif text-3xl">{value}</div>
        {diff && (
          <div
            className={cn(
              "flex items-center text-xs font-medium",
              isGood ? "text-emerald-500" : "text-red-500",
            )}
          >
            {diff.positive ? "+" : "-"}
            {diff.value}
            {unit}
          </div>
        )}
      </div>
      {diff && (
        <div className="mt-1 text-[10px] text-muted-foreground uppercase tracking-widest">
          {diff.label} from last scan
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-3xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
