import { useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTY_LABELS } from "../data/categories";
import {
  cardLibrary,
  searchCardLibrary,
  totalLibraryCards,
  type LibraryDifficulty,
  type LibraryEntry,
} from "../utils/cardLibrary";
import { cn } from "../utils/cn";
import { toKurdishDigits } from "../utils/format";
import { CardAvatar } from "./CardAvatar";
import { DifficultyBadge } from "./DifficultyBadge";

interface Props {
  onHome: () => void;
  usedCards: readonly string[];
}

const difficulties: LibraryDifficulty[] = ["all", "easy", "medium", "hard"];
const focusStyle = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

export function DeveloperScreen({ onHome, usedCards }: Props) {
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<LibraryDifficulty>("all");
  const [exportError, setExportError] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const usedSet = useMemo(() => new Set(usedCards), [usedCards]);
  const matchedGroups = useMemo(() => searchCardLibrary(query, difficulty), [query, difficulty]);
  const visibleGroups = matchedGroups.filter(
    (group) => (categoryId === "all" || group.category.id === categoryId) && group.entries.length > 0,
  );
  const matchingCount = matchedGroups.reduce((total, group) => total + group.entries.length, 0);
  const visibleCount = visibleGroups.reduce((total, group) => total + group.entries.length, 0);
  const hasFilters = query !== "" || difficulty !== "all" || categoryId !== "all";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const chooseCategory = (id: string) => {
    setCategoryId(id);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const resetFilters = () => {
    setQuery("");
    setDifficulty("all");
    setCategoryId("all");
    setExportError(false);
    searchRef.current?.focus();
  };

  const exportVisibleCards = () => {
    let url: string | undefined;
    let link: HTMLAnchorElement | undefined;
    try {
      const data = visibleGroups.map(({ category, entries }) => ({
        id: category.id,
        title: category.title,
        subtitle: category.subtitle,
        cards: entries.map(({ id, position, card }) => ({ id, position, ...card })),
      }));
      url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }));
      link = document.createElement("a");
      link.href = url;
      link.download = `who-am-i-cards-${categoryId}-${difficulty}.json`;
      document.body.appendChild(link);
      link.click();
      setExportError(false);
    } catch {
      setExportError(true);
    } finally {
      link?.remove();
      // Let the browser start the download before releasing its URL.
      if (url) {
        const downloadUrl = url;
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
    }
  };

  return (
    <div className="developer-library min-h-screen bg-slate-950 text-white" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-black sm:text-3xl">من کێم؟</span>
            <span className="hidden border-r border-white/15 pr-4 font-mono text-xs text-emerald-300 sm:block" dir="ltr" lang="en">
              Developer mode
            </span>
          </div>
          <button
            type="button"
            onClick={onHome}
            className={cn("flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white", focusStyle)}
          >
            گەڕانەوە بۆ یاری
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </header>

      <main className="library-enter mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-emerald-300" dir="ltr" lang="en">
              CARD LIBRARY / READ-ONLY
            </p>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-black outline-none sm:text-4xl">
              دۆخی گەشەپێدەر
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
              هەموو کارتەکان و زانیارییەکانیان ببینە؛ ئەم بینینە کاریگەری لەسەر خاڵ و مێژووی یارییەکانت نییە.
            </p>
          </div>
          <button
            type="button"
            onClick={exportVisibleCards}
            disabled={visibleCount === 0}
            title="داگرتنی ئەو کارتانەی نیشان دەدرێن"
            className={cn("flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-300/60 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40", focusStyle)}
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4" />
            </svg>
            داگرتنی JSON
          </button>
        </div>
        {exportError && (
          <p role="alert" className="mb-5 text-sm text-rose-300">داگرتن سەرکەوتوو نەبوو. تکایە جارێکی تر هەوڵ بدەرەوە.</p>
        )}

        <div className="grid items-start gap-7 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-9">
          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <h2 className="mb-3 px-3 text-sm font-bold text-slate-400">پۆلەکان</h2>
            <nav aria-label="پاڵاوتن بەپێی پۆل" className="space-y-1">
              <CategoryButton
                title="هەموو پۆلەکان"
                count={matchingCount}
                total={totalLibraryCards}
                selected={categoryId === "all"}
                onClick={() => chooseCategory("all")}
              />
              {matchedGroups.map(({ category, entries }) => (
                <CategoryButton
                  key={category.id}
                  title={category.title}
                  count={entries.length}
                  total={category.cards.length}
                  selected={categoryId === category.id}
                  onClick={() => chooseCategory(category.id)}
                />
              ))}
            </nav>
            <p className="mt-5 border-t border-white/10 px-3 pt-4 text-xs leading-6 text-slate-500">
              کارتە بەکارهاتووەکانیش لێرە دەردەکەون، تەنانەت ئەگەر «کارت دووبارە نەبێتەوە» چالاک بێت.
            </p>
          </aside>

          <div className="min-w-0">
            <div role="search" className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-semibold text-slate-400">گەڕان لە ناو و زانیارییەکان</span>
                <span className="relative block">
                  <svg aria-hidden="true" className="pointer-events-none absolute right-3.5 top-3.5 h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" />
                  </svg>
                  <input
                    ref={searchRef}
                    type="search"
                    dir="auto"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ناو، ناوی لاتینی یان زانیاری..."
                    autoComplete="off"
                    spellCheck={false}
                    className={cn("h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-4 pr-11 text-sm text-white placeholder:text-slate-500", focusStyle)}
                  />
                </span>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-400">ئاستی سەختی</span>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as LibraryDifficulty)}
                  className={cn("h-12 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white", focusStyle)}
                >
                  {difficulties.map((level) => (
                    <option key={level} value={level}>{level === "all" ? "هەموو ئاستەکان" : DIFFICULTY_LABELS[level]}</option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2 lg:hidden">
                <span className="mb-2 block text-xs font-semibold text-slate-400">پۆل</span>
                <select
                  value={categoryId}
                  onChange={(event) => chooseCategory(event.target.value)}
                  className={cn("h-12 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white", focusStyle)}
                >
                  <option value="all">هەموو پۆلەکان ({toKurdishDigits(totalLibraryCards)})</option>
                  {cardLibrary.map(({ category }) => (
                    <option key={category.id} value={category.id}>{category.title} ({toKurdishDigits(category.cards.length)})</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex min-h-9 items-center justify-between gap-3 border-b border-white/10 pb-4">
              <p role="status" aria-live="polite" aria-atomic="true" className="text-xs text-slate-400">
                نیشاندانی <span className="font-bold text-white">{toKurdishDigits(visibleCount)}</span> لە {toKurdishDigits(totalLibraryCards)} کارت
              </p>
              {hasFilters && (
                <button type="button" onClick={resetFilters} className={cn("min-h-9 rounded-lg px-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200", focusStyle)}>
                  پاککردنەوەی فلتەرەکان
                </button>
              )}
            </div>

            {visibleGroups.length === 0 ? (
              <div className="py-20 text-center">
                <h2 className="text-xl font-bold">هیچ کارتێک نەدۆزرایەوە</h2>
                <p className="mt-3 text-sm text-slate-400">وشەیەکی تر بنووسە یان پۆل و ئاستەکە بگۆڕە.</p>
                <button type="button" onClick={resetFilters} className={cn("mt-5 min-h-11 rounded-xl bg-emerald-400 px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-300", focusStyle)}>
                  بینینی هەموو کارتەکان
                </button>
              </div>
            ) : (
              visibleGroups.map(({ category, entries }) => {
                const medical = category.id === "diseases" || category.id === "medications";
                return (
                  <section key={category.id} aria-labelledby={`library-${category.id}`} className="mt-8 first:mt-6">
                    <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span aria-hidden="true" className={cn("mt-1.5 h-5 w-1 shrink-0 rounded-full", category.accent)} />
                        <div className="min-w-0">
                          <h2 id={`library-${category.id}`} className="text-lg font-extrabold" lang={medical ? "en" : "ckb"} dir={medical ? "ltr" : "rtl"}>
                            {medical ? (category.id === "diseases" ? "Diseases" : "Medications") : category.title}
                          </h2>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500" dir="ltr" lang="en">{category.id}</p>
                        </div>
                      </div>
                      <span className="shrink-0 pt-1 text-xs tabular-nums text-slate-400" lang={medical ? "en" : "ckb"} dir={medical ? "ltr" : "rtl"}>
                        {medical ? `${entries.length} / ${category.cards.length} cards` : `${toKurdishDigits(entries.length)} / ${toKurdishDigits(category.cards.length)} کارت`}
                      </span>
                    </div>
                    <ul className="divide-y divide-white/10">
                      {entries.map((entry) => (
                        <LibraryCard key={entry.key} entry={entry} medical={medical} used={usedSet.has(entry.id)} />
                      ))}
                    </ul>
                  </section>
                );
              })
            )}
            <footer className="mt-10 border-t border-white/10 pt-5 text-xs leading-6 text-slate-500">
              تەنها بۆ بینین. سەرچاوەی کارتەکان: <code dir="ltr" className="inline-block font-mono text-slate-400">src/data/categories.ts</code>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}

function CategoryButton({ title, count, total, selected, onClick }: {
  title: string;
  count: number;
  total: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn("flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border-r-2 px-3 py-3 text-right text-sm leading-6 transition-colors", selected ? "border-emerald-300 bg-emerald-400/10 font-bold text-emerald-200" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white", focusStyle)}
    >
      <span>{title}</span>
      <span className="shrink-0 font-mono text-[11px] tabular-nums opacity-80" dir="ltr">
        {count === total ? toKurdishDigits(total) : `${toKurdishDigits(count)}/${toKurdishDigits(total)}`}
      </span>
    </button>
  );
}

function LibraryCard({ entry, medical, used }: { entry: LibraryEntry; medical: boolean; used: boolean }) {
  const { card, id, position } = entry;
  return (
    <li className="library-row py-5" lang={medical ? "en" : "ckb"} dir={medical ? "ltr" : "rtl"}>
      <div className="flex items-start gap-3 sm:gap-4">
        <span aria-hidden="true" className="w-6 shrink-0 pt-1 font-mono text-[11px] tabular-nums text-slate-600" dir="ltr">
          {medical ? String(position).padStart(2, "0") : toKurdishDigits(String(position).padStart(2, "0"))}
        </span>
        {card.image && (
          <CardAvatar
            src={card.image}
            name={card.name}
            size="sm"
            loading="lazy"
            className="border-2 border-white/15 shadow-none ring-0 sm:h-14 sm:w-14"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <h3 dir="auto" className="min-w-0 break-words text-base font-extrabold text-slate-100 sm:text-lg">{card.name}</h3>
            <DifficultyBadge d={card.difficulty} language={medical ? "en" : "ckb"} className="shrink-0" />
          </div>
          {card.latin && card.latin !== card.name && (
            <p dir="ltr" lang="en" className="mt-1 text-start text-sm text-slate-400">{card.latin}</p>
          )}
          <p dir="auto" className="mt-3 whitespace-pre-wrap break-words text-start text-sm leading-7 text-slate-300">{card.hint}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
            <code dir="ltr" className="max-w-full break-all font-mono">{id}</code>
            <span className={used ? "text-amber-300/80" : "text-slate-500"}>
              {medical ? (used ? "Played before" : "Not played yet") : (used ? "پێشتر یاری پێکراوە" : "هێشتا یاری پێنەکراوە")}
            </span>
            {card.image && (
              <a href={card.image} target="_blank" rel="noopener noreferrer" className={cn("rounded text-slate-400 underline decoration-white/20 underline-offset-4 hover:text-emerald-300", focusStyle)}>
                {medical ? "Open image" : "بینینی وێنە"}
                <span className="sr-only">{medical ? " (opens in a new tab)" : " (لە پەنجەرەیەکی نوێ)"}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}