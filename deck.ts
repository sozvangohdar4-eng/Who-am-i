import type { Card, Difficulty } from "../data/categories";
import { shuffle } from "./format";

export interface PoolEntry {
  card: Card;
  id: string;
}

export type DifficultyFilter = "all" | Difficulty;

/**
 * Build a balanced, game-ready deck.
 *
 * Problem it solves:
 * - Some categories are heavily skewed (e.g. historical: 14 easy / 30 medium / 57 hard).
 *   A pure random shuffle would therefore start the round with mostly HARD cards.
 * - A 60-second round only ever shows the first ~10-15 cards, so ORDER matters more
 *   than the full contents.
 *
 * Strategy when filter is "all":
 * - Shuffle each difficulty bucket separately.
 * - Interleave with a repeating 5-slot pattern: [easy, medium, easy, medium, hard]
 *   → ~40% easy / 40% medium / 20% hard at the start of the game.
 * - Hard cards are spread out (never back-to-back at the start) and the game
 *   always opens with easy cards as a warm-up.
 * - When a bucket runs out, fall back to easy → medium → hard so hard cards
 *   stay rare for as long as possible.
 *
 * When a specific difficulty is selected, just shuffle that bucket.
 */
export function buildBalancedDeck(entries: PoolEntry[], filter: DifficultyFilter): PoolEntry[] {
  if (filter !== "all") {
    return shuffle(entries);
  }

  const easy = shuffle(entries.filter((e) => e.card.difficulty === "easy"));
  const medium = shuffle(entries.filter((e) => e.card.difficulty === "medium"));
  const hard = shuffle(entries.filter((e) => e.card.difficulty === "hard"));

  // Anything unexpected (shouldn't happen) — keep it, shuffled, at the end.
  const other = shuffle(
    entries.filter(
      (e) => e.card.difficulty !== "easy" && e.card.difficulty !== "medium" && e.card.difficulty !== "hard",
    ),
  );

  const buckets: Record<"easy" | "medium" | "hard", PoolEntry[]> = { easy, medium, hard };

  const take = (pref: "easy" | "medium" | "hard"): PoolEntry | undefined => {
    if (buckets[pref].length > 0) return buckets[pref].shift()!;
    // Fallback: prefer easy, then medium, save hard for last.
    // (For "hard" slots we still try hard first above, then fall back here.)
    if (buckets.easy.length > 0) return buckets.easy.shift()!;
    if (buckets.medium.length > 0) return buckets.medium.shift()!;
    if (buckets.hard.length > 0) return buckets.hard.shift()!;
    return undefined;
  };

  // 5-slot cycle → 40% easy / 40% medium / 20% hard while buckets last.
  // Hard never appears twice in a row from this pattern.
  const pattern: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "easy", "medium", "hard"];

  const result: PoolEntry[] = [];
  let i = 0;
  const total = entries.length;
  // Safety guard so we can never infinite-loop.
  let guard = total * 3 + 10;

  while (result.length < total && guard-- > 0) {
    if (buckets.easy.length === 0 && buckets.medium.length === 0 && buckets.hard.length === 0) break;
    const pref = pattern[i % pattern.length];
    i++;
    const next = take(pref);
    if (next) result.push(next);
    else break;
  }

  return [...result, ...other];
}

export interface DifficultyCounts {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export function countByDifficulty(entries: PoolEntry[]): DifficultyCounts {
  let easy = 0;
  let medium = 0;
  let hard = 0;
  for (const e of entries) {
    if (e.card.difficulty === "easy") easy++;
    else if (e.card.difficulty === "medium") medium++;
    else if (e.card.difficulty === "hard") hard++;
  }
  return { easy, medium, hard, total: entries.length };
}
