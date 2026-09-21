import { categories, cardId, type Card, type Category, type Difficulty } from "../data/categories";

export type LibraryDifficulty = "all" | Difficulty;

export interface LibraryEntry {
  key: string;
  id: string;
  position: number;
  card: Card;
  searchText: string;
}

export interface LibraryGroup {
  category: Category;
  entries: LibraryEntry[];
}

export function normalizeCardSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u064a\u0649]/g, "\u06cc")
    .replace(/\u0643/g, "\u06a9")
    .replace(/[\u0640\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) =>
      String(digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660)),
    )
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Keep every source entry, even duplicate names, and never use the active game deck.
export const cardLibrary: LibraryGroup[] = categories.map((category) => ({
  category,
  entries: category.cards.map((card, index) => ({
    key: `${category.id}:${index}`,
    id: cardId(category.id, card),
    position: index + 1,
    card,
    searchText: normalizeCardSearch(
      [card.name, card.latin, card.hint, cardId(category.id, card), category.title].join(" "),
    ),
  })),
}));

export const totalLibraryCards = cardLibrary.reduce((total, group) => total + group.entries.length, 0);

export function searchCardLibrary(query: string, difficulty: LibraryDifficulty): LibraryGroup[] {
  const terms = normalizeCardSearch(query).split(" ").filter(Boolean);
  return cardLibrary.map((group) => ({
    category: group.category,
    entries: group.entries.filter(
      ({ card, searchText }) =>
        (difficulty === "all" || card.difficulty === difficulty) &&
        terms.every((term) => searchText.includes(term)),
    ),
  }));
}