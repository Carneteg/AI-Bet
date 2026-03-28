import type { Match } from "@/data/matches";

/**
 * Beräknar ett value score (0-100) baserat på skillnaden
 * mellan implicita sannolikheter (odds) och verkliga sannolikheter.
 */
export function calculateValueScore(match: Match): number {
  const impliedHome = (1 / match.odds.home) * 100;
  const impliedDraw = (1 / match.odds.draw) * 100;
  const impliedAway = (1 / match.odds.away) * 100;
  const totalImplied = impliedHome + impliedDraw + impliedAway;

  const normHome = (impliedHome / totalImplied) * 100;
  const normDraw = (impliedDraw / totalImplied) * 100;
  const normAway = (impliedAway / totalImplied) * 100;

  const bestValue = Math.max(
    match.probabilities.home - normHome,
    match.probabilities.draw - normDraw,
    match.probabilities.away - normAway
  );

  const score = Math.min(100, Math.max(0, 50 + bestValue * 2));
  return Math.round(score);
}

export function getValueLabel(score: number): string {
  if (score >= 85) return "Utmärkt";
  if (score >= 70) return "Bra";
  if (score >= 55) return "OK";
  return "Svagt";
}

export function getValueColor(score: number): string {
  if (score >= 85) return "text-accent-green";
  if (score >= 70) return "text-brand";
  if (score >= 55) return "text-accent-yellow";
  return "text-accent-red";
}
