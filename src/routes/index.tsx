import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Dumbbell,
  Brain,
  Apple,
  LineChart,
  MessageCircle,
  Users,
  Flame,
  Bell,
  Target,
  Trophy,
  Timer,
  ShieldAlert,
  Video,
  Camera,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Gym Master — Your Adaptive AI Fitness Coach" },
      {
        name: "description",
        content:
          "Gym Master adapts to you. Smart workouts, local meal plans, AI coach chat, form videos, and InBody analysis — all in one app.",
      },
      { property: "og:title", content: "Gym Master — Adaptive AI Fitness" },
      {
        property: "og:description",
        content:
          "An AI coach that adjusts your plan, plans cheap local meals, and keeps you consistent.",
      },
    ],
  }),
});

const features = [
  {
    icon: Brain,
    title: "Adaptive AI Engine",
    body: "Your plan rewrites itself weekly based on missed sessions, fatigue, and progress speed.",
  },
  {
    icon: Apple,
    title: "Local Meal Planner",
    body: "Cheap bulking & cutting plans built around eggs, rice, beans, and chicken — student budget friendly.",
  },
  {
    icon: LineChart,
    title: "Progress Intelligence",
    body: "Not just charts. Insights like “you’re improving slower than expected this week.”",
  },
  {
    icon: MessageCircle,
    title: "AI Coach Chat",
    body: "Ask anything: replace bench press, what to eat today, recover from a missed leg day.",
  },
  {
    icon: Users,
    title: "Smart Trainer Bridge",
    body: "AI flags plateaus and suggests when a 15-min trainer call would unlock progress.",
  },
  {
    icon: Flame,
    title: "Forgiving Streaks",
    body: "Behavior-aware. Skip Sundays? It learns and turns that into your rest day.",
  },
  {
    icon: Bell,
    title: "Context Notifications",
    body: "“You usually train at 7 PM — ready?” No spam, ever.",
  },
  {
    icon: Target,
    title: "Goal Roadmaps",
    body: "“Lose 5kg in 8 weeks” broken into phases and milestones you can actually see.",
  },
  {
    icon: Trophy,
    title: "Light Gamification",
    body: "XP, levels, and quiet achievements — never punishing.",
  },
  {
    icon: Dumbbell,
    title: "Gym Check-In",
    body: "One tap clocks you in. The app knows you’re lifting.",
  },
  {
    icon: Timer,
    title: "Rest Timer",
    body: "Auto-starts between sets. Customizable per exercise.",
  },
  {
    icon: ShieldAlert,
    title: "Injury-Aware Swaps",
    body: "Tell it your injury — it filters out unsafe machines and rebuilds the session.",
  },
  {
    icon: Video,
    title: "Form Videos",
    body: "Ask about squats — get a demo video plus the 3 form cues that matter most.",
  },
  {
    icon: Camera,
    title: "InBody Photo Analysis",
    body: "Upload your InBody scan. Get a plan tuned to your weight, height, and body composition.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="relative z-20">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-serif text-xl">Gym Master</span>
          </div>
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#build" className="hover:text-foreground transition-colors">
              Build guide
            </a>
          </div>
          <Link
            to="/auth"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Soft gradient orbs */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--lov-peach), transparent 70%)" }}
        />

        <div className="mx-auto max-w-5xl px-6 pb-32 pt-20 text-center md:pt-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Adaptive AI fitness, built for real life
          </div>

          <h1 className="mt-8 font-serif text-6xl leading-[1.05] tracking-tight md:text-8xl">
            Your coach,
            <br />
            <span className="italic text-muted-foreground">not just</span> a plan.
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground md:text-xl">
            Gym Master rewrites your week when you miss a session, plans cheap local meals, and
            quietly keeps you consistent.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="group flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
            >
              Start training free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-card"
            >
              See how it adapts
            </a>
          </div>

          {/* Floating preview card */}
          <div className="mx-auto mt-20 max-w-2xl">
            <div
              className="rounded-3xl border border-border bg-card/70 p-2 shadow-2xl backdrop-blur-xl"
              style={{ boxShadow: "0 30px 80px -20px oklch(0.5 0.05 50 / 0.25)" }}
            >
              <div className="rounded-2xl bg-background/80 p-6 text-left">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: "linear-gradient(135deg, var(--lov-peach), var(--lov-pink))",
                    }}
                  >
                    <Brain className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Coach update
                    </div>
                    <div className="font-serif text-lg">This week</div>
                  </div>
                </div>
                <p className="mt-4 font-serif text-2xl leading-snug">
                  “You missed 2 leg sessions — switching to a lighter recovery plan and shifting
                  volume to Thursday.”
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                    Fatigue detected
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                    Recovery week
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-foreground"
                    style={{ background: "color-mix(in oklch, var(--lov-mint) 60%, transparent)" }}
                  >
                    Plan updated
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Everything inside
          </div>
          <h2 className="mt-4 font-serif text-5xl leading-tight md:text-6xl">
            Built like a coach,
            <br />
            <span className="italic">not a generator.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition-all hover:bg-card hover:shadow-lg"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg, var(--lov-peach), var(--lov-pink) 70%)",
                }}
              >
                <f.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="mt-4 font-serif text-2xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              How it adapts
            </div>
            <h2 className="mt-4 font-serif text-5xl md:text-6xl">A loop, not a list.</h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Listen",
                b: "Tracks check-ins, completed sets, fatigue, missed days.",
              },
              { n: "02", t: "Adapt", b: "Rewrites next week — volume, exercise swaps, rest days." },
              {
                n: "03",
                t: "Coach",
                b: "Sends quiet, contextual nudges and answers your questions.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-3xl border border-border bg-card/70 p-8 backdrop-blur"
              >
                <div className="font-serif text-5xl text-muted-foreground">{s.n}</div>
                <div className="mt-4 font-serif text-2xl">{s.t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILD GUIDE */}
      <section id="build" className="mx-auto max-w-4xl px-6 py-24">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Free Flutter build guide
          </div>
          <h2 className="mt-4 font-serif text-5xl md:text-6xl">Ship it yourself.</h2>
          <p className="mt-6 text-muted-foreground">
            Every tool below has a free tier. No credit card needed to start.
          </p>
        </div>

        <ol className="mt-12 space-y-6">
          {[
            {
              t: "Install your tools",
              b: "Flutter SDK (free), Android Studio (free), VS Code with the Flutter & Dart extensions. On Windows enable developer mode; on Mac install Xcode if you want iOS builds.",
            },
            {
              t: "Create the project",
              b: "flutter create gym_master && cd gym_master. Add packages: supabase_flutter, google_generative_ai, image_picker, flutter_local_notifications, fl_chart, youtube_player_flutter.",
            },
            {
              t: "Free backend — Supabase",
              b: "Create a free Supabase project. Tables: profiles, workouts, sets, meals, checkins, injuries, inbody_scans. Enable Row Level Security on every table.",
            },
            {
              t: "Free AI — Gemini API",
              b: "Get a free Gemini API key at aistudio.google.com. Use it for the coach chat, weekly plan rewrites, and InBody photo analysis (Gemini 1.5 Flash is multimodal and free-tier generous).",
            },
            {
              t: "Form videos — YouTube Data API",
              b: "Free quota of 10,000 units/day. Search by exercise name, embed the top result with youtube_player_flutter, and ask Gemini for the 3 form cues.",
            },
            {
              t: "Gym check-in & rest timer",
              b: "Local: a single boolean in app state + a timestamp in checkins table. Rest timer is a simple Dart Timer.periodic with a configurable seconds value per exercise.",
            },
            {
              t: "Adaptive engine logic",
              b: "Cron a Supabase Edge Function (free) that runs weekly. It reads last 7 days of completed sets vs planned, sends the diff to Gemini, and writes a new plan row.",
            },
            {
              t: "InBody photo analysis",
              b: "image_picker → upload to Supabase Storage → send the URL to Gemini Vision with a prompt: extract weight, body fat %, muscle mass, then return recommendations as JSON.",
            },
            {
              t: "Notifications",
              b: "flutter_local_notifications (free, on-device). Schedule based on the user’s most-common training hour from checkins.",
            },
            {
              t: "Ship",
              b: "flutter build apk for Android — share the APK directly. iOS requires the $99/yr Apple developer account; skip until you’re ready.",
            },
          ].map((step, i) => (
            <li
              key={step.t}
              className="flex gap-6 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur"
            >
              <div className="font-serif text-3xl text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="font-serif text-2xl">{step.t}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-6 pb-32">
        <div
          className="mx-auto max-w-4xl rounded-[2rem] border border-border p-12 text-center md:p-20"
          style={{
            background:
              "linear-gradient(135deg, var(--lov-peach), var(--lov-pink) 60%, var(--lov-lavender))",
          }}
        >
          <h2 className="font-serif text-5xl leading-tight text-foreground md:text-6xl">
            The gym is open.
            <br />
            <span className="italic">Your coach is too.</span>
          </h2>
          <Link
            to="/auth"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            Start training free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-serif text-base text-foreground">Gym Master</span>
          </div>
          <span>© {new Date().getFullYear()} — Built with care.</span>
        </div>
      </footer>
    </div>
  );
}
