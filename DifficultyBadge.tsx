import { DIFFICULTY_LABELS, type Difficulty } from "../data/categories";
import { cn } from "../utils/cn";

const styles: Record<Difficulty, string> = {
  easy: "bg-emerald-400/20 text-emerald-100 border-emerald-300/40",
  medium: "bg-amber-400/20 text-amber-100 border-amber-300/40",
  hard: "bg-rose-400/20 text-rose-100 border-rose-300/40",
};

const englishLabels: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

export function DifficultyBadge({ d, className, language = "ckb" }: { d: Difficulty; className?: string; language?: "ckb" | "en" }) {
  return (
    <span
      lang={language}
      dir={language === "en" ? "ltr" : "rtl"}
      className={cn(
        "inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold backdrop-blur-sm",
        styles[d],
        className,
      )}
    >
      {language === "en" ? englishLabels[d] : DIFFICULTY_LABELS[d]}
    </span>
  );
}
