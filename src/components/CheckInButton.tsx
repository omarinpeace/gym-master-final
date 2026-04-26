import { useEffect, useState } from "react";
import { Dumbbell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function CheckInButton() {
  const { user } = useAuth();
  const [active, setActive] = useState<{ id: string; started_at: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("checkins")
      .select("id,started_at")
      .eq("user_id", user.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setActive(data));
  }, [user]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [active]);

  const checkIn = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("checkins")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setActive(data);
    toast.success("Clocked into the gym 💪");
  };

  const checkOut = async () => {
    if (!active) return;
    const { error } = await supabase
      .from("checkins")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", active.id);
    if (error) return toast.error(error.message);
    setActive(null);
    setElapsed(0);
    toast.success("Session logged.");
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  };

  if (active) {
    return (
      <button
        onClick={checkOut}
        className="group flex items-center gap-3 rounded-2xl border border-border px-5 py-3 transition-all hover:shadow-md"
        style={{ background: "linear-gradient(135deg, var(--lov-mint), var(--lov-peach) 80%)" }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
          <Dumbbell className="h-4 w-4" />
        </div>
        <div className="text-left">
          <div className="text-xs uppercase tracking-wider text-foreground/70">In the gym</div>
          <div className="font-serif text-lg leading-tight">{fmt(elapsed)}</div>
        </div>
        <LogOut className="ml-3 h-4 w-4 text-foreground/60 group-hover:text-foreground" />
      </button>
    );
  }

  return (
    <button
      onClick={checkIn}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 transition-all hover:shadow-md"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: "linear-gradient(135deg, var(--lov-peach), var(--lov-pink))" }}
      >
        <Dumbbell className="h-4 w-4" />
      </div>
      <div className="text-left">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Tap to</div>
        <div className="font-serif text-lg leading-tight">Check into gym</div>
      </div>
    </button>
  );
}
