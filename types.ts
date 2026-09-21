import type { Card, Difficulty } from "./data/categories";

export interface Settings {
  categoryIds: string[];
  duration: number; // seconds
  tilt: boolean;
  sound: boolean;
  showLatin: boolean;
  difficulty: "all" | Difficulty;
  avoidRepeat: boolean;
}

export interface RoundResult {
  card: Card;
  correct: boolean;
}

export interface RoundSummary {
  results: RoundResult[];
  score: number;
  categoryTitle: string;
  timestamp: number;
}

export type Screen = "home" | "countdown" | "play" | "results" | "developer";
