import type { RoundResult } from "../types";
import { toKurdishDigits } from "../utils/format";
import { cn } from "../utils/cn";
import { CardAvatar } from "./CardAvatar";
import { DifficultyBadge } from "./DifficultyBadge";

interface Props {
  results: RoundResult[];
  categoryTitle: string;
  onReplay: () => void;
  onHome: () => void;
}

function verdict(score: number, total: number): { emoji: string; text: string } {
  if (total === 0) return { emoji: "🤷", text: "هیچ کارتێک نەبینرا" };
  const r = score / total;
  if (score >= 15 || r >= 0.9) return { emoji: "🏆", text: "شێری کوردستان! نایاب" };
  if (score >= 10 || r >= 0.7) return { emoji: "🔥", text: "زۆر باش! بەردەوام بە" };
  if (score >= 5 || r >= 0.5) return { emoji: "👏", text: "باشە، دەتوانیت باشتر بیت" };
  if (score >= 1) return { emoji: "🙂", text: "دەستپێکێکی باش" };
  return { emoji: "😅", text: "جارێکی تر هەوڵ بدەرەوە!" };
}

export function ResultsScreen({ results, categoryTitle, onReplay, onHome }: Props) {
  const score = results.filter((r) => r.correct).length;
  const passed = results.length - score;
  const v = verdict(score, results.length);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-5 pb-36 pt-10">
        <div className="text-center">
          <div className="text-7xl">{v.emoji}</div>
          <h1 className="mt-3 text-3xl font-black">{v.text}</h1>
          <p className="mt-1 text-slate-400">{categoryTitle}</p>

          <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-5">
              <div className="text-5xl font-black text-emerald-300">{toKurdishDigits(score)}</div>
              <div className="mt-1 text-sm text-emerald-100">ڕاست</div>
            </div>
            <div className="rounded-2xl border border-orange-400/30 bg-orange-500/15 p-5">
              <div className="text-5xl font-black text-orange-300">{toKurdishDigits(passed)}</div>
              <div className="mt-1 text-sm text-orange-100">تێپەڕێنراو</div>
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xl font-bold">کارتەکان</h2>
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4",
                    r.correct
                      ? "border-emerald-400/20 bg-emerald-500/10"
                      : "border-orange-400/20 bg-orange-500/10",
                  )}
                >
                  <span className="mt-0.5 text-xl">{r.correct ? "✅" : "⏭️"}</span>
                  <CardAvatar src={r.card.image} name={r.card.name} size="sm" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-extrabold" dir="auto">{r.card.name}</span>
                      <DifficultyBadge d={r.card.difficulty} />
                    </div>
                    {r.card.latin && (
                      <div className="text-sm text-slate-400" dir="ltr" style={{ textAlign: "right" }}>
                        {r.card.latin}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-slate-300">💡 {r.card.hint}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-5 pt-10">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button
            onClick={onReplay}
            className="flex-1 rounded-2xl bg-gradient-to-l from-emerald-400 to-emerald-500 py-4 text-xl font-black text-slate-950 shadow-2xl shadow-emerald-500/40 active:scale-[0.98]"
          >
            🔁 جارێکی تر
          </button>
          <button
            onClick={onHome}
            className="flex-1 rounded-2xl border border-white/15 bg-white/10 py-4 text-xl font-bold backdrop-blur active:scale-[0.98]"
          >
            🏠 سەرەتا
          </button>
        </div>
      </div>
    </div>
  );
}
