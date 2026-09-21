import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, Category } from "../data/categories";
import type { RoundResult } from "../types";
import { useTilt } from "../hooks/useTilt";
import { sounds } from "../utils/audio";
import { toKurdishDigits } from "../utils/format";
import { cn } from "../utils/cn";
import { CardAvatar } from "./CardAvatar";
import { DifficultyBadge } from "./DifficultyBadge";

interface Props {
  deck: Card[];
  category: Category | null; // null when mixed
  duration: number;
  tilt: boolean;
  sound: boolean;
  showLatin: boolean;
  onFinish: (results: RoundResult[]) => void;
  onQuit: () => void;
}

type Flash = "correct" | "pass" | null;

export function PlayScreen({ deck, category, duration, tilt, sound, showLatin, onFinish, onQuit }: Props) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [flash, setFlash] = useState<Flash>(null);
  const [paused, setPaused] = useState(false);
  const resultsRef = useRef<RoundResult[]>([]);
  const finishedRef = useRef(false);
  const lockRef = useRef(false);

  const card = deck[index];
  const score = resultsRef.current.filter((r) => r.correct).length;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (sound) sounds.end();
    onFinish(resultsRef.current);
  }, [onFinish, sound]);

  // Timer
  useEffect(() => {
    if (paused) return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => {
      setTimeLeft((v) => v - 1);
      if (sound && timeLeft <= 6 && timeLeft > 1) sounds.tick();
    }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft, paused, finish, sound]);

  const answer = useCallback(
    (correct: boolean) => {
      if (finishedRef.current || paused || lockRef.current || !card) return;
      lockRef.current = true;
      resultsRef.current = [...resultsRef.current, { card, correct }];
      if (sound) (correct ? sounds.correct : sounds.pass)();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(correct ? 30 : 60);
        } catch {
          /* ignore */
        }
      }
      setFlash(correct ? "correct" : "pass");
      setTimeout(() => {
        setFlash(null);
        lockRef.current = false;
        if (index + 1 >= deck.length) {
          finish();
        } else {
          setIndex((i) => i + 1);
        }
      }, 550);
    },
    [card, deck.length, finish, index, paused, sound],
  );

  // Tilt: screen toward the floor = correct, screen toward the ceiling = pass.
  const tiltStatus = useTilt(tilt && !paused, (dir) => answer(dir === "down"));

  // Keyboard support
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === "ArrowRight") answer(true);
      else if (e.key === "ArrowUp" || e.key === " " || e.key === "ArrowLeft") answer(false);
      else if (e.key === "Escape") setPaused((p) => !p);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [answer]);

  const pct = (timeLeft / duration) * 100;
  const urgent = timeLeft <= 10;
  const tiltLive = tilt && tiltStatus.active; // sensor really is delivering data on this device
  const waitingForUpright = tiltLive && !tiltStatus.armed && !flash;

  const bg =
    flash === "correct"
      ? "from-emerald-500 to-green-600"
      : flash === "pass"
        ? "from-orange-500 to-amber-600"
        : category
          ? category.gradient
          : "from-slate-700 via-slate-800 to-slate-900";

  return (
    <div
      className={cn(
        "relative flex h-[100dvh] w-full select-none flex-col overflow-hidden bg-gradient-to-br text-white transition-colors duration-300",
        bg,
      )}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Timer bar */}
      <div className="absolute inset-x-0 top-0 z-30 h-2 bg-black/30">
        <div
          className={cn("h-full transition-all duration-1000 ease-linear", urgent ? "bg-red-400" : "bg-white/90")}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-4 pt-5">
        <button
          type="button"
          onClick={() => setPaused(true)}
          className="rounded-full bg-black/25 px-3.5 py-1.5 text-sm font-semibold backdrop-blur transition hover:bg-black/40 active:scale-95"
        >
          ⏸ وەستان
        </button>
        <div
          className={cn(
            "rounded-full bg-black/25 px-4 py-1.5 text-2xl font-black tabular-nums backdrop-blur",
            urgent && "animate-pulse text-red-200",
          )}
        >
          ⏱ {toKurdishDigits(timeLeft)}
        </div>
        <div className="rounded-full bg-black/25 px-3.5 py-1.5 text-sm font-semibold backdrop-blur">
          ✅ {toKurdishDigits(score)}
        </div>
      </div>

      {/* Full-screen background tap zones:
          Right half (first in RTL) triggers Correct (ڕاستە)
          Left half (second in RTL) triggers Pass (تێپەڕێنە)
      */}
      <div className="absolute inset-0 z-10 flex" style={{ touchAction: "manipulation" }}>
        <button
          type="button"
          tabIndex={-1}
          aria-label="ڕاستە"
          onClick={() => answer(true)}
          className="h-full w-1/2 cursor-pointer bg-transparent active:bg-emerald-400/15 focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="تێپەڕێنە"
          onClick={() => answer(false)}
          className="h-full w-1/2 cursor-pointer bg-transparent active:bg-orange-400/15 focus:outline-none"
        />
      </div>

      {/* Card content */}
      <div className="pointer-events-none relative z-20 flex flex-1 flex-col items-center justify-center px-6 text-center">
        {flash ? (
          <div className="animate-[pop_0.4s_ease-out]">
            <div className="text-8xl">{flash === "correct" ? "✅" : "⏭️"}</div>
            <div className="mt-4 text-4xl font-black">{flash === "correct" ? "ڕاستە!" : "تێپەڕا"}</div>
          </div>
        ) : (
          <div key={index} className="animate-[pop_0.3s_ease-out]">
            {category && (
              <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">
                {category.emoji} {category.title}
              </div>
            )}
            <div className="mb-4 flex justify-center">
              <CardAvatar
                src={card.image}
                name={card.name}
                size="lg"
                categoryIcon={category?.emoji || "❓"}
              />
            </div>
            <div className="mb-3 flex items-center justify-center">
              <DifficultyBadge d={card.difficulty} />
            </div>
            <h2
              dir="auto"
              className={cn(
                "font-black leading-tight drop-shadow-xl",
                card.name.length > 18 ? "text-4xl sm:text-6xl" : "text-5xl sm:text-7xl md:text-8xl",
              )}
            >
              {card.name}
            </h2>
            {showLatin && card.latin && (
              <p className="mt-3 text-xl text-white/80 sm:text-2xl" dir="ltr">{card.latin}</p>
            )}
            <p className="mx-auto mt-6 max-w-lg rounded-xl bg-black/20 px-4 py-2 text-sm text-white/85 backdrop-blur-sm">
              💡 {card.hint}
            </p>
          </div>
        )}
      </div>

      {/* Bottom action buttons — ALWAYS ACTIVE, VISIBLE, AND CLICKABLE */}
      <div className="relative z-30 px-4 pb-6 pt-2">
        {waitingForUpright && (
          <div className="mb-2.5 animate-pulse rounded-xl bg-amber-400/40 py-1.5 text-center text-xs font-bold text-amber-100 backdrop-blur">
            📱 مۆبایلەکە ڕاست ڕابگرە لەسەر ناوچەوانت… لارکردنەوە خەریکە چالاک دەبێت
          </div>
        )}
        <div className="grid grid-cols-2 gap-3" style={{ touchAction: "manipulation" }}>
          {/* Right button in RTL: "ڕاستە" (Correct - green) */}
          <button
            type="button"
            aria-label="ڕاستە"
            onClick={(e) => {
              e.stopPropagation();
              answer(true);
            }}
            className={cn(
              "flex min-h-[58px] cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-center font-black text-white transition-all duration-150 active:scale-95 select-none",
              "bg-emerald-600/95 hover:bg-emerald-500 active:bg-emerald-700 border-2 border-emerald-400/60 shadow-xl shadow-emerald-950/40",
              tiltLive && tiltStatus.zone === "down" && "scale-105 ring-4 ring-white bg-emerald-500",
            )}
          >
            <span className="text-xl">✅</span>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-base sm:text-lg font-black leading-tight">ڕاستە</span>
              {tilt && <span className="text-[10px] font-normal opacity-85 leading-tight">شاشە بەرەو زەوی</span>}
            </div>
          </button>

          {/* Left button in RTL: "تێپەڕێنە" (Pass - orange) */}
          <button
            type="button"
            aria-label="تێپەڕێنە"
            onClick={(e) => {
              e.stopPropagation();
              answer(false);
            }}
            className={cn(
              "flex min-h-[58px] cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-center font-black text-white transition-all duration-150 active:scale-95 select-none",
              "bg-orange-600/95 hover:bg-orange-500 active:bg-orange-700 border-2 border-orange-400/60 shadow-xl shadow-orange-950/40",
              tiltLive && tiltStatus.zone === "up" && "scale-105 ring-4 ring-white bg-orange-500",
            )}
          >
            <span className="text-xl">⏭</span>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-base sm:text-lg font-black leading-tight">تێپەڕێنە</span>
              {tilt && <span className="text-[10px] font-normal opacity-85 leading-tight">شاشە بەرەو ئاسمان</span>}
            </div>
          </button>
        </div>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center backdrop-blur">
          <div className="text-6xl">⏸️</div>
          <h3 className="mt-4 text-3xl font-black">یاری وەستاوە</h3>
          <p className="mt-2 text-slate-300">
            {toKurdishDigits(timeLeft)} چرکە ماوە · {toKurdishDigits(score)} ڕاست
          </p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="rounded-2xl bg-emerald-400 py-4 text-xl font-black text-slate-950"
            >
              بەردەوام بە ▶
            </button>
            <button
              type="button"
              onClick={finish}
              className="rounded-2xl bg-white/10 py-3 font-bold hover:bg-white/15"
            >
              کۆتایی هێنان و ئەنجامەکان
            </button>
            <button
              type="button"
              onClick={onQuit}
              className="py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              گەڕانەوە بۆ سەرەتا
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
