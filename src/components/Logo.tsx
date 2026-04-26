import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({ className, iconClassName, showText = false, textClassName }: LogoProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    // Proactively check if the logo exists to avoid broken image flicker
    const img = new Image();
    img.src = "/logo.png";
    img.onload = () => setError(false);
    img.onerror = () => setError(true);
  }, []);

  const icon = (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden transition-colors",
        error ? "bg-foreground text-background" : "bg-transparent",
        iconClassName,
      )}
    >
      {!error ? (
        <img
          src="/logo.png"
          alt="Gym Master"
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <Dumbbell className="h-4 w-4" />
      )}
    </div>
  );

  if (!showText) {
    return icon;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {icon}
      <span className={cn("font-serif text-xl text-foreground", textClassName)}>Gym Master</span>
    </div>
  );
}
