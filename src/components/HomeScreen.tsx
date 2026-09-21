import { useState } from "react";
import { categories, DIFFICULTY_LABELS, type Difficulty } from "../data/categories";
import type { Settings, RoundSummary } from "../types";
import { cn } from "../utils/cn";
import { isTiltSupported } from "../hooks/useTilt";
import { toKurdishDigits } from "../utils/format";

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onStart: () => void;
  history: RoundSummary[];
  totalInSelection: number; // cards matching categories + difficulty
  freshCount: number; // not yet used in previous rounds
  usedCount: number;
  onClearUsed: () => void;
  onOpenDeveloper: () => void;
  difficultyBreakdown: { easy: number; medium: number; hard: number; total: number };
}

const durations = [45, 60, 90, 120];

const difficultyOptions: { key: "all" | Difficulty; label: string; chip: string }[] = [
  { key: "all", label: "هەموو", chip: "border-white/40 bg-white/10" },
  { key: "easy", label: DIFFICULTY_LABELS.easy, chip: "border-emerald-400/50 bg-emerald-400/15" },
  { key: "medium", label: DIFFICULTY_LABELS.medium, chip: "border-amber-400/50 bg-amber-400/15" },
  { key: "hard", label: DIFFICULTY_LABELS.hard, chip: "border-rose-400/50 bg-rose-400/15" },
];

export function HomeScreen({
  settings,
  onChange,
  onStart,
  history,
  totalInSelection,
  freshCount,
  usedCount,
  onClearUsed,
  onOpenDeveloper,
  difficultyBreakdown,
}: Props) {
  const [showHelp, setShowHelp] = useState(false);
  const tiltOk = isTiltSupported();

  const toggleCategory = (id: string) => {
    const has = settings.categoryIds.includes(id);
    const next = has ? settings.categoryIds.filter((c) => c !== id) : [...settings.categoryIds, id];
    onChange({ ...settings, categoryIds: next });
  };

  const selectAll = () => onChange({ ...settings, categoryIds: categories.map((c) => c.id) });

  const canStart = settings.categoryIds.length > 0 && totalInSelection > 0;
  const playable = settings.avoidRepeat ? Math.max(freshCount, 0) : totalInSelection;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-red-600/30 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-2xl flex-col gap-8 px-5 pb-44 pt-10">
        {/* Header */}
        <header className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 via-amber-400 to-emerald-500 shadow-2xl shadow-amber-500/30">
            <span className="text-4xl">🤔</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight">من کێم؟</h1>
          <p className="mt-2 text-lg text-slate-300">یاری هەڵهێنانی ناوەکان بە کوردی</p>
          <button
            onClick={() => setShowHelp(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur transition hover:bg-white/10"
          >
            <span>❓</span> چۆن یاری دەکرێت؟
          </button>
        </header>

        {/* Categories */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">پۆلەکان</h2>
            <button onClick={selectAll} className="text-sm text-amber-300 hover:text-amber-200">
              هەموویان هەڵبژێرە
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categories.map((cat) => {
              const selected = settings.categoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl p-4 text-right transition-all duration-200",
                    "border-2",
                    selected
                      ? "border-white/80 shadow-xl scale-[1.01]"
                      : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br", cat.gradient)} />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative flex items-start gap-3">
                    <span className="text-3xl drop-shadow">{cat.emoji}</span>
                    <div className="flex-1">
                      <div className="text-lg font-extrabold leading-tight">{cat.title}</div>
                      <div className="mt-1 text-xs text-white/80">{cat.subtitle}</div>
                      <div className="mt-2 inline-block rounded-full bg-black/25 px-2 py-0.5 text-xs">
                        {toKurdishDigits(cat.cards.length)} کارت
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white/80 transition",
                        selected ? "bg-white text-slate-900" : "bg-transparent",
                      )}
                    >
                      {selected && (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Difficulty */}
        <section>
          <h2 className="mb-3 text-xl font-bold">ئاستی سەختی</h2>
          <div className="grid grid-cols-4 gap-2">
            {difficultyOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onChange({ ...settings, difficulty: opt.key })}
                className={cn(
                  "rounded-xl border py-3 text-base font-bold transition",
                  settings.difficulty === opt.key
                    ? cn(opt.chip, "text-white shadow-lg ring-2 ring-white/30")
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {settings.difficulty === "all" ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-200">
                <span>⚖️</span>
                <span>تێکەڵی هاوسەنگ چالاکە</span>
              </div>
              <p className="mt-1.5 text-xs leading-6 text-slate-300">
                یاری بە کارتە ئاسانەکان دەستپێدەکات. هەر ٥ کارت جارێک دانەیەکی سەخت دێت — کەمتر لە ٢٠٪ی سەرەتای یاری سەخت دەبێت، تەنانەت ئەگەر پۆلەکە زۆر کارتی سەختی تێدابێت.
              </p>
              {difficultyBreakdown.total > 0 && (
                <>
                  <div
                    className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
                    dir="ltr"
                  >
                    <div
                      className="bg-emerald-400"
                      style={{
                        width: `${(difficultyBreakdown.easy / difficultyBreakdown.total) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-amber-400"
                      style={{
                        width: `${(difficultyBreakdown.medium / difficultyBreakdown.total) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-rose-400"
                      style={{
                        width: `${(difficultyBreakdown.hard / difficultyBreakdown.total) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-300">
                    <span>
                      <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      ئاسان: {toKurdishDigits(difficultyBreakdown.easy)}
                    </span>
                    <span>
                      <span className="ml-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                      ناوەند: {toKurdishDigits(difficultyBreakdown.medium)}
                    </span>
                    <span>
                      <span className="ml-1 inline-block h-2 w-2 rounded-full bg-rose-400" />
                      سەخت: {toKurdishDigits(difficultyBreakdown.hard)}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              تەنها کارتەکانی ئەم ئاستە دەردەکەون: {toKurdishDigits(totalInSelection)} کارت
            </p>
          )}
        </section>

        {/* Duration */}
        <section>
          <h2 className="mb-3 text-xl font-bold">کاتی هەر خولێک</h2>
          <div className="grid grid-cols-4 gap-2">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => onChange({ ...settings, duration: d })}
                className={cn(
                  "rounded-xl border py-3 text-lg font-bold transition",
                  settings.duration === d
                    ? "border-amber-400 bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/30"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
                )}
              >
                {toKurdishDigits(d)}
                <span className="block text-[11px] font-normal opacity-80">چرکە</span>
              </button>
            ))}
          </div>
        </section>

        {/* Options */}
        <section>
          <h2 className="mb-3 text-xl font-bold">ڕێکخستنەکان</h2>
          <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Toggle
              label="کارت دووبارە نەبێتەوە"
              desc="کارتەکانی خولەکانی پێشوو لە یارییەکانی داهاتوودا دووبارە ناکرێنەوە"
              checked={settings.avoidRepeat}
              onChange={(v) => onChange({ ...settings, avoidRepeat: v })}
            />
            {settings.avoidRepeat && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-slate-300">
                  {toKurdishDigits(usedCount)} کارت بەکارهاتووە
                  {usedCount > 0 && freshCount < totalInSelection && (
                    <span className="text-slate-400"> · {toKurdishDigits(freshCount)} نوێ ماوە</span>
                  )}
                </span>
                {usedCount > 0 && (
                  <button
                    onClick={onClearUsed}
                    className="shrink-0 rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-1.5 text-rose-200 transition hover:bg-rose-400/20"
                  >
                    پاککردنەوە
                  </button>
                )}
              </div>
            )}
            <Toggle
              label="کۆنترۆڵ بە لارکردنەوەی مۆبایل"
              desc={
                tiltOk
                  ? "شاشە بەرەو زەوی = ڕاستە، شاشە بەرەو ئاسمان = تێپەڕێنە (تەنها کاتێک مۆبایلەکە ڕاست بێت کار دەکات)"
                  : "ئەم ئامێرە پشتگیری ناکات"
              }
              checked={settings.tilt && tiltOk}
              disabled={!tiltOk}
              onChange={(v) => onChange({ ...settings, tilt: v })}
            />
            <Toggle
              label="دەنگ"
              desc="دەنگی ڕاست، تێپەڕاندن و کاتژمێر"
              checked={settings.sound}
              onChange={(v) => onChange({ ...settings, sound: v })}
            />
            <Toggle
              label="ناوی لاتینی/ئینگلیزی"
              desc="لەژێر ناوی کوردی نیشان بدرێت"
              checked={settings.showLatin}
              onChange={(v) => onChange({ ...settings, showLatin: v })}
            />
            <button
              id="developer-mode-button"
              type="button"
              onClick={onOpenDeveloper}
              className="group flex min-h-20 w-full items-center gap-3 px-4 py-4 text-right transition-colors hover:bg-emerald-400/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300"
            >
              <svg aria-hidden="true" className="h-6 w-6 shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold">دۆخی گەشەپێدەر</span>
                  <span dir="ltr" lang="en" className="text-xs text-emerald-300/80">Developer mode</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">بینینی هەموو کارتەکان و زانیارییەکانیان</p>
              </div>
              <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m14 6-6 6 6 6" />
              </svg>
            </button>
          </div>
        </section>

        {/* History */}
        {history.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-bold">خولەکانی پێشوو</h2>
            <ul className="space-y-2">
              {history.slice(0, 5).map((h) => (
                <li
                  key={h.timestamp}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-slate-300">{h.categoryTitle}</span>
                  <span className="font-bold text-emerald-300">
                    {toKurdishDigits(h.score)} / {toKurdishDigits(h.results.length)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Sticky start button */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-5 pt-10">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={onStart}
            disabled={!canStart}
            className={cn(
              "w-full rounded-2xl py-5 text-2xl font-black transition-all",
              canStart
                ? "bg-gradient-to-l from-emerald-400 to-emerald-500 text-slate-950 shadow-2xl shadow-emerald-500/40 active:scale-[0.98]"
                : "cursor-not-allowed bg-slate-800 text-slate-500",
            )}
          >
            {canStart ? `دەست پێ بکە ▶` : "پۆلێک هەڵبژێرە"}
          </button>
          {canStart && (
            <p className="mt-2 text-center text-xs text-slate-400">
              {toKurdishDigits(playable)} کارت بەردەستە
              {settings.avoidRepeat && freshCount < Math.min(10, totalInSelection) && totalInSelection > 0 && (
                <span> · کارتەکان نوێ دەستپێدەکرێنەوە</span>
              )}
            </p>
          )}
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 px-4 py-3",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition",
          checked ? "bg-emerald-400" : "bg-slate-600",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "right-1" : "right-6",
          )}
        />
      </button>
    </label>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: "👥", text: "بە لایەنی کەمەوە دوو کەس پێویستە. یەکێک یاریزانە و ئەوانی تر ڕێنمایی دەدەن." },
    { icon: "📱", text: "یاریزان مۆبایلەکە دەخاتە سەر ناوچەوانی بەبێ ئەوەی شاشەکە ببینێت." },
    { icon: "🗣️", text: "هاوڕێکان وەسفی ناوەکە دەکەن بەبێ ئەوەی خودی ناوەکە بڵێن." },
    { icon: "✅", text: "ئەگەر ڕاستت هەڵهێنا، مۆبایلەکە بۆ خوارەوە لار بکەرەوە (شاشە بەرەو زەوی) یان دەست بدە لە لای سەوز." },
    { icon: "⏭️", text: "ئەگەر نەتزانی، مۆبایلەکە بۆ سەرەوە لار بکەرەوە (شاشە بەرەو ئاسمان) یان دەست بدە لە لای نارنجی." },
    { icon: "📐", text: "لارکردنەوە تەنها کاتێک کار دەکات کە مۆبایلەکە ساتێک ڕاست لەسەر ناوچەوان بێت؛ دوای هەر وەڵامێک بیگەڕێنەرەوە بۆ ڕاستی." },
    { icon: "🏆", text: "لە کۆتایی کات، خاڵەکانت و لیستی ناوەکان دەبینیت." },
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-2xl font-black">چۆن یاری دەکرێت؟</h3>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
                {s.icon}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-slate-200">{s.text}</p>
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-amber-400 py-3 font-bold text-slate-900 transition hover:bg-amber-300"
        >
          تێگەیشتم
        </button>
      </div>
    </div>
  );
}
