import { Link, useRouter, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  MessageCircle,
  LineChart,
  User,
  LogOut,
  Camera,
  Video,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { type ReactNode } from "react";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/app/meals", label: "Meals", icon: Apple },
  { to: "/app/coach", label: "Coach", icon: MessageCircle },
  { to: "/app/progress", label: "Progress", icon: LineChart },
  { to: "/app/form", label: "Form lookup", icon: Video },
  { to: "/app/inbody", label: "InBody", icon: Camera },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-border px-5 py-6 md:flex">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo />
              <span className="font-serif text-xl">Gym Master</span>
            </Link>
            <ThemeToggle />
          </div>

          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {nav.map((n) => {
              const active =
                location.pathname === n.to ||
                (n.to !== "/app" && location.pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={async () => {
              await signOut();
              router.navigate({ to: "/auth" });
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        {/* Mobile floating theme toggle */}
        <div className="fixed right-4 top-4 z-40 md:hidden">
          <ThemeToggle />
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
          <div className="flex justify-around px-2 py-2">
            {nav.slice(0, 5).map((n) => {
              const active =
                location.pathname === n.to ||
                (n.to !== "/app" && location.pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <n.icon className="h-5 w-5" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 px-6 pb-24 pt-6 md:px-10 md:pb-10">{children}</main>
      </div>
    </div>
  );
}
