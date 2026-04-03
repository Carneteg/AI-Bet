import type { Recommendation } from "@/data/matches";

// Thresholds for recommendation classification
const SPIK_MIN_VALUE_SCORE = 75;   // minimum value score to qualify as a "spik" (lock)
const SPIK_MIN_HOME_PROB = 55;     // minimum home-win probability for a spik

const SKRALL_MIN_EDGE = 8;         // minimum edge (%) for an upset warning ("skräll")
const SKRALL_MAX_SIGN_PROB = 30;   // sign probability must be low to count as upset

const GARDERING_MAX_VALUE_SCORE = 50; // below this score, hedge recommended

export function calculateRecommendation(params: {
  valueScore: number;
  bestEdge: number;
  bestSignProbability: number;
  homeProbability: number;
}): Recommendation {
  const { valueScore, bestEdge, bestSignProbability, homeProbability } = params;
  if (valueScore >= SPIK_MIN_VALUE_SCORE && homeProbability >= SPIK_MIN_HOME_PROB)
    return "spik";
  if (bestEdge >= SKRALL_MIN_EDGE && bestSignProbability <= SKRALL_MAX_SIGN_PROB)
    return "skräll";
  if (valueScore < GARDERING_MAX_VALUE_SCORE)
    return "gardering";
  return "normal";
}
