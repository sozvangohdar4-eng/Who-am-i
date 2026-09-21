import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories, cardId, type Card, type Category } from "./data/categories";
import type { RoundResult, RoundSummary, Screen, Settings } from "./types";
import { HomeScreen } from "./components/HomeScreen";
import { CountdownScreen } from "./components/CountdownScreen";
import { PlayScreen } from "./components/PlayScreen";
import { ResultsScreen } from "./components/ResultsScreen";
import { DeveloperScreen } from "./components/DeveloperScreen";
import { requestTiltPermission } from "./hooks/useTilt";
import { sounds } from "./utils/audio";
import { buildBalancedDeck, countByDifficulty } from "./utils/deck";

const SETTINGS_KEY = "kurdish-who-am-i-settings";
const HISTORY_KEY = "kurdish-who-am-i-history";
const USED_KEY = "kurdish-who-am-i-used-cards";

const defaultSettings: Settings = {
  categoryIds: [categories[0].id],
  duration: 60,
  tilt: false,
  sound: true,
  showLatin: true,
  difficulty: "all",
  avoidRepeat: true,
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...(fallback as object), ...(JSON.parse(raw) as object) } as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

function loadArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) return v;
    }
  } catch {
    /* ignore */
  }
  return [];
}

interface PoolEntry {
  card: Card;
  id: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [settings, setSettings] = useState<Settings>(() => loadJSON(SETTINGS_KEY, defaultSettings));
  const [history, setHistory] = useState<RoundSummary[]>(() => loadArray(HISTORY_KEY) as unknown as RoundSummary[]);
  const [usedCards, setUsedCards] = useState<string[]>(() => loadArray(USED_KEY));
  const [deck, setDeck] = useState<Card[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [tiltGranted, setTiltGranted] = useState(false);
  const homeScrollRef = useRef(0);
  const restoreHomeRef = useRef(false);

  const openDeveloper = useCallback(() => {
    homeScrollRef.current = window.scrollY;
    setScreen("developer");
  }, []);

  const closeDeveloper = useCallback(() => {
    restoreHomeRef.current = true;
    setScreen("home");
  }, []);

  useEffect(() => {
    if (screen === "home" && restoreHomeRef.current) {
      restoreHomeRef.current = false;
      window.scrollTo({ top: homeScrollRef.current, behavior: "auto" });
      document.getElementById("developer-mode-button")?.focus({ preventScroll: true });
    }
  }, [screen]);

  // Hide the scrollbar on the home screen only — scrolling itself stays functional
  useEffect(() => {
    const targets = [document.documentElement, document.body];
    targets.forEach((el) => el.classList.toggle("scrollbar-none", screen === "home"));
    return () => targets.forEach((el) => el.classList.remove("scrollbar-none"));
  }, [screen]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(USED_KEY, JSON.stringify(usedCards.slice(-2000)));
  }, [usedCards]);

  const selected = useMemo(
    () => categories.filter((c) => settings.categoryIds.includes(c.id)),
    [settings.categoryIds],
  );

  // Full pool for the current selection + difficulty
  const pool = useMemo<PoolEntry[]>(() => {
    return selected.flatMap((c) =>
      c.cards
        .filter((card) => settings.difficulty === "all" || card.difficulty === settings.difficulty)
        .map((card) => ({ card, id: cardId(c.id, card) })),
    );
  }, [selected, settings.difficulty]);

  const usedSet = useMemo(() => new Set(usedCards), [usedCards]);
  const freshCount = useMemo(() => pool.filter((e) => !usedSet.has(e.id)).length, [pool, usedSet]);
  const difficultyBreakdown = useMemo(() => countByDifficulty(pool), [pool]);

  const singleCategory: Category | null = selected.length === 1 ? selected[0] : null;
  const categoryTitle = singleCategory
    ? singleCategory.title
    : `تێکەڵ (${selected.map((c) => c.emoji).join(" ")})`;

  const buildDeck = useCallback(() => {
    let entries = pool;
    if (settings.avoidRepeat) {
      const fresh = entries.filter((e) => !usedSet.has(e.id));
      // If (almost) everything was already used, start over with the full pool
      if (fresh.length >= Math.min(10, entries.length)) entries = fresh;
    }
    // Balanced mix: when "all" difficulties are allowed, interleave so the
    // round opens with easy cards and hard cards stay ~20% and spread out.
    const ordered = buildBalancedDeck(entries, settings.difficulty);
    setDeck(ordered.map((e) => e.card));
  }, [pool, settings.avoidRepeat, settings.difficulty, usedSet]);

  const start = useCallback(async () => {
    if (settings.sound) sounds.unlock();
    if (settings.tilt) {
      const ok = await requestTiltPermission();
      setTiltGranted(ok);
    }
    buildDeck();
    setResults([]);
    setScreen("countdown");
  }, [buildDeck, settings.sound, settings.tilt]);

  const finish = useCallback(
    (r: RoundResult[]) => {
      setResults(r);
      // Remember every card that appeared this round
      const seen: string[] = [];
      for (const res of r) {
        const cat = categories.find((c) => c.cards.includes(res.card));
        if (cat) seen.push(cardId(cat.id, res.card));
      }
      setUsedCards((prev) => Array.from(new Set([...prev, ...seen])));
      setHistory((h) => [
        { results: r, score: r.filter((x) => x.correct).length, categoryTitle, timestamp: Date.now() },
        ...h,
      ]);
      setScreen("results");
    },
    [categoryTitle],
  );

  const clearUsedCards = useCallback(() => setUsedCards([]), []);

  // Keep screen awake while playing (best-effort)
  useEffect(() => {
    if (screen !== "play") return;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    nav.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [screen]);

  if (screen === "developer") {
    return <DeveloperScreen onHome={closeDeveloper} usedCards={usedCards} />;
  }

  if (screen === "countdown") {
    return (
      <CountdownScreen
        sound={settings.sound}
        tilt={settings.tilt}
        onDone={() => setScreen("play")}
        onCancel={() => setScreen("home")}
      />
    );
  }

  if (screen === "play") {
    return (
      <PlayScreen
        key={deck.length + "-" + (deck[0]?.latin || deck[0]?.name) + "-" + Date.now()}
        deck={deck}
        category={singleCategory}
        duration={settings.duration}
        tilt={settings.tilt && tiltGranted}
        sound={settings.sound}
        showLatin={settings.showLatin}
        onFinish={finish}
        onQuit={() => setScreen("home")}
      />
    );
  }

  if (screen === "results") {
    return (
      <ResultsScreen
        results={results}
        categoryTitle={categoryTitle}
        onReplay={start}
        onHome={() => setScreen("home")}
      />
    );
  }

  return (
    <HomeScreen
      settings={settings}
      onChange={setSettings}
      onStart={start}
      history={history}
      totalInSelection={pool.length}
      freshCount={freshCount}
      usedCount={usedCards.length}
      onClearUsed={clearUsedCards}
      onOpenDeveloper={openDeveloper}
      difficultyBreakdown={difficultyBreakdown}
    />
  );
}
