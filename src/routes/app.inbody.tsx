import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { analyzeInBody, generatePlan } from "@/lib/ai.functions";
import { Camera, Dumbbell, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/inbody")({
  component: InBodyPage,
});

type Scan = {
  id: string;
  image_url: string | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  recommendations: string | null;
  created_at: string;
};

function InBodyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeInBody);
  const genPlan = useServerFn(generatePlan);

  const buildPlanFromScan = async () => {
    setGenerating(true);
    try {
      const { summary } = await genPlan();
      toast.success(summary ?? "Plan generated from your InBody scan");
      navigate({ to: "/app/workouts" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("inbody_scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setScans(data ?? []);
  };

  useEffect(() => {
    void load();
  }, [user]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("inbody").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("inbody").createSignedUrl(path, 3600);
      if (!signed?.signedUrl) throw new Error("Could not sign URL");
      await analyze({ data: { imageUrl: signed.signedUrl } });
      toast.success("Scan analyzed");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          InBody analysis
        </div>
        <h1 className="mt-1 font-serif text-5xl">Upload your scan.</h1>
        <p className="mt-2 text-muted-foreground">
          We extract weight, body fat, and muscle mass — then tune recommendations to you.
        </p>
      </header>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/60 p-10 transition-colors hover:bg-card disabled:opacity-60"
      >
        {uploading ? (
          <span className="font-serif text-xl text-muted-foreground">Analyzing…</span>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <span className="font-serif text-xl">Upload InBody photo</span>
          </>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      <div className="space-y-4">
        {scans.map((s, idx) => (
          <div key={s.id} className="rounded-3xl border border-border bg-card/70 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Camera className="h-4 w-4" />
                {new Date(s.created_at).toLocaleDateString()}
                {idx === 0 && (
                  <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                    Latest
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Metric label="Weight" value={s.weight_kg ? `${s.weight_kg} kg` : "—"} />
              <Metric label="Body fat" value={s.body_fat_pct ? `${s.body_fat_pct}%` : "—"} />
              <Metric label="Muscle" value={s.muscle_mass_kg ? `${s.muscle_mass_kg} kg` : "—"} />
            </div>
            {s.recommendations && (
              <p className="mt-4 font-serif text-lg leading-snug">{s.recommendations}</p>
            )}
            {idx === 0 && (
              <button
                onClick={buildPlanFromScan}
                disabled={generating}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Dumbbell className="h-4 w-4" />
                {generating ? "Designing your plan…" : "Design workout plan from this scan"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-xl">{value}</div>
    </div>
  );
}
