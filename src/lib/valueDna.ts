import { UserValue } from "@/types";

// Canonical value dimensions — same 12 from GoalInput.tsx
export const VALUE_DIMENSIONS = [
  "Fairness",
  "Sustainability",
  "Cost efficiency",
  "Speed to market",
  "User safety",
  "Inclusivity",
  "Privacy",
  "Innovation",
  "Long-term viability",
  "Transparency",
  "Community impact",
  "Quality",
] as const;

export type ValueDimension = (typeof VALUE_DIMENSIONS)[number];

/** Fuzzy-match a value label to the closest canonical dimension */
function matchDimension(label: string): number {
  const lower = label.toLowerCase();

  // Direct or near-direct matches
  for (let i = 0; i < VALUE_DIMENSIONS.length; i++) {
    if (lower === VALUE_DIMENSIONS[i].toLowerCase()) return i;
    if (lower.includes(VALUE_DIMENSIONS[i].toLowerCase())) return i;
    if (VALUE_DIMENSIONS[i].toLowerCase().includes(lower)) return i;
  }

  // Keyword-based matching
  const keywordMap: Record<number, string[]> = {
    0: ["fair", "equit", "just", "equal"],
    1: ["sustain", "environment", "green", "eco", "climate"],
    2: ["cost", "budget", "afford", "cheap", "econom", "effici"],
    3: ["speed", "fast", "quick", "rapid", "time", "agile", "market"],
    4: ["safe", "secur", "protect", "risk", "harm"],
    5: ["inclus", "divers", "access", "represent"],
    6: ["privac", "data", "surveillance", "consent"],
    7: ["innov", "creat", "novel", "experiment", "pioneer"],
    8: ["long-term", "sustain", "viab", "durable", "future-proof"],
    9: ["transparen", "open", "honest", "account", "trust"],
    10: ["communit", "social", "impact", "people", "stakeholder"],
    11: ["quality", "excellen", "reliab", "craft", "standard"],
  };

  for (const [idx, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((kw) => lower.includes(kw))) return Number(idx);
  }

  return -1; // no match
}

/** Compute a 12-dimensional Value DNA vector from revealed values */
export function computeValueDna(values: UserValue[]): number[] {
  const dna = new Array(VALUE_DIMENSIONS.length).fill(0);

  for (const v of values) {
    const idx = matchDimension(v.label);
    if (idx >= 0) {
      dna[idx] = Math.max(dna[idx], v.strength);
    }
  }

  return dna;
}

/** Get labels for non-zero dimensions */
export function getDnaLabels(dna: number[]): { label: string; strength: number }[] {
  return dna
    .map((strength, i) => ({ label: VALUE_DIMENSIONS[i], strength }))
    .filter((d) => d.strength > 0)
    .sort((a, b) => b.strength - a.strength);
}
