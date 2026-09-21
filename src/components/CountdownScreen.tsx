import { useEffect, useState } from "react";
import { sounds } from "../utils/audio";
import { toKurdishDigits } from "../utils/format";

interface Props {
  sound: boolean;
  tilt: boolean;
  onDone: () => void;
  onCancel: () => void;
}

export function CountdownScreen({ sound, tilt, onDone, onCancel }: Props) {
  const [n, setN] = useState(3);

  useEffect(() => {
    if (sound) sounds.countdown();
    if (n === 0) {
      if (sound) sounds.go();
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 text-center text-white">
      <p className="mb-6 text-2xl font-bold text-slate-200 sm:text-3xl">
        📱 مۆبایلەکە بخە سەر ناوچەوانت
      </p>
      <div
        key={n}
        className="flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-8xl font-black text-slate-950 shadow-2xl shadow-amber-500/40 animate-[pop_0.5s_ease-out]"
      >
        {n === 0 ? "🚀" : toKurdishDigits(n)}
      </div>
      <p className="mt-8 text-slate-400">هاوڕێکانت ئامادە بن بۆ وەسفکردن!</p>
      {tilt && (
        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          <p className="text-slate-300">لارکردنەوە چالاکە — مۆبایلەکە ڕاست ڕابگرە تا کارتی یەکەم دەردەکەوێت</p>
          <div className="flex items-center gap-3 text-slate-200">
            <span className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5">
              ⬇️ شاشە بەرەو زەوی = ✅ ڕاستە
            </span>
            <span className="rounded-lg border border-orange-400/40 bg-orange-500/20 px-3 py-1.5">
              ⬆️ شاشە بەرەو ئاسمان = ⏭ تێپەڕێنە
            </span>
          </div>
        </div>
      )}
      <button onClick={onCancel} className="mt-10 text-sm text-slate-500 underline-offset-4 hover:underline">
        هەڵوەشاندنەوە
      </button>
    </div>
  );
}
