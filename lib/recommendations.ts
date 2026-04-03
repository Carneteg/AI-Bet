import type { Recommendation } from "@/data/matches";

export function calculateRecommendation(params: {
  valueScore: number;
  bestEdge: number;
  bestSignProbability: number;
  homeProbability: number;
}): Recommendation {
  const { valueScore, bestEdge, bestSignProbability, homeProbability } = params;
  if (valueScore >= 75 && homeProbability >= 55) return "spik";
  if (bestEdge >= 8 && bestSignProbability <= 30) return "skräll";
  if (valueScore < 50) return "gardering";
  return "normal";
}
