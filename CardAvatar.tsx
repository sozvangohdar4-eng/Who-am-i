import { useState } from "react";
import { cn } from "../utils/cn";

interface Props {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  categoryIcon?: string;
  loading?: "eager" | "lazy";
}

const sizeClasses = {
  sm: "h-12 w-12 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 sm:h-32 sm:w-32 text-2xl",
  xl: "h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 text-4xl",
};

export function CardAvatar({ src, name, size = "md", className, categoryIcon, loading = "eager" }: Props) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Derive initial from name
  const initial = name.trim().charAt(0) || "؟";

  if (!src || error) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-gradient-to-tr from-white/10 to-white/30 font-black shadow-2xl backdrop-blur-md",
          sizeClasses[size],
          className,
        )}
      >
        <span className="drop-shadow">{categoryIcon || initial}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border-4 border-white/40 bg-black/20 shadow-2xl backdrop-blur-sm ring-4 ring-black/10",
        sizeClasses[size],
        className,
      )}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 animate-pulse text-white/50">
          {categoryIcon || initial}
        </div>
      )}
      <img
        src={src}
        alt={name}
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "h-full w-full object-cover object-top transition-opacity duration-300",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
        )}
      />
    </div>
  );
}
