import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { exerciseFormHelp } from "@/lib/ai.functions";
import { Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/form")({
  component: FormLookupPage,
});

type Result = {
  exercise: string;
  youtube_query: string;
  form_cues: string[];
  common_mistakes: string[];
  muscles_worked: string[];
  youtubeEmbed: string;
  videoId: string | null;
  provider: "youtube" | "search";
};

function FormLookupPage() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const lookup = useServerFn(exerciseFormHelp);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await lookup({ data: { exercise: q } });
      setResult(r as Result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Form lookup</div>
        <h1 className="mt-1 font-serif text-5xl">Get the cues right.</h1>
      </header>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type an exercise (e.g. squats, romanian deadlift)…"
          className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {loading ? "…" : "Look up"}
        </button>
      </form>

      {result && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card/70 p-2">
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              {result.provider === "youtube" ? (
                <iframe
                  src={result.youtubeEmbed}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={result.exercise}
                />
              ) : (
                <a
                  href={result.youtubeEmbed}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-full w-full items-center justify-center text-sm text-white/80 hover:text-white"
                >
                  Couldn't embed a video — open tutorials on YouTube →
                </a>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/70 p-6">
            <h2 className="font-serif text-3xl">{result.exercise}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Muscles: {result.muscles_worked.join(", ")}
            </p>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Form cues
              </div>
              <ul className="mt-2 space-y-2">
                {result.form_cues.map((c, i) => (
                  <li key={i} className="rounded-xl bg-background/60 p-3 text-sm">
                    <span className="mr-2 font-serif text-muted-foreground">{i + 1}.</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Common mistakes
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {result.common_mistakes.map((m, i) => (
                  <li key={i}>— {m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
