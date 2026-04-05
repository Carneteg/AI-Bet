/**
 * Värdebedömning för Stryktips och fasta odds.
 *
 * Det kritiska insikten för en vinnande bettare:
 *
 * 1. FAST ODDS: Edge = din sannolikhet - bookmakerens implicita sannolikhet
 *    → Enkel arbitrage mot kalkylerade odds
 *
 * 2. STRYKTIPS (parimutuell pool): Edge = din sannolikhet - streckningsprocent
 *    → Du konkurrerar mot andra spelare, INTE mot bookmaker
 *    → Hög streckad andel på favorit = dålig utdelning om du vinner
 *    → Låg streckad andel på underdog = enorm utdelning om rätt
 *
 * Kombinerat value score väger BÅDA perspektiven.
 */

import type { Match } from "@/data/matches";

export interface ValueBreakdown {
  oddsEdge: number;          // Edge mot bookmaker (procentenheter)
  streckningEdge: number;    // Edge mot streckningsprocent (procentenheter)
  compositeScore: number;    // Kombinerat värde 0-100
  bestSign: "1" | "X" | "2";
  bestOddsEdge: number;
  bestStreckningEdge: number;
  isStreckningValue: boolean; // True om streckningsfördel > oddsfördel
}

/**
 * Beräknar kombinerat value score (0-100).
 *
 * Stryktips-logik: streckningsfördelen viktas tyngre (60%)
 * Odds-logik: oddsfördelen viktas (40%)
 *
 * Det är streckningsprocenten som avgör utdelningen — inte oddsen.
 */
export function calculateValueScore(match: Match): number {
  const breakdown = getValueBreakdown(match);
  return breakdown.compositeScore;
}

export function getValueBreakdown(match: Match): ValueBreakdown {
  // Guard: if odds are missing or zero, return a neutral "unknown" breakdown
  // rather than propagating NaN (1/0 = Infinity, Infinity/Infinity = NaN).
  if (
    !match.odds.home || match.odds.home <= 0 || !isFinite(match.odds.home) ||
    !match.odds.draw || match.odds.draw <= 0 || !isFinite(match.odds.draw) ||
    !match.odds.away || match.odds.away <= 0 || !isFinite(match.odds.away)
  ) {
    return {
      oddsEdge: 0,
      streckningEdge: 0,
      compositeScore: 0,
      bestSign: "1",
      bestOddsEdge: 0,
      bestStreckningEdge: 0,
      isStreckningValue: false,
    };
  }

  // ── Odds-baserad edge ──────────────────────────────────────────────
  const impliedHome = (1 / match.odds.home) * 100;
  const impliedDraw = (1 / match.odds.draw) * 100;
  const impliedAway = (1 / match.odds.away) * 100;
  const totalImplied = impliedHome + impliedDraw + impliedAway;

  // Normalisera för bookmakers marginal
  const normHome = (impliedHome / totalImplied) * 100;
  const normDraw = (impliedDraw / totalImplied) * 100;
  const normAway = (impliedAway / totalImplied) * 100;

  const oddsEdgeHome = match.probabilities.home - normHome;
  const oddsEdgeDraw = match.probabilities.draw - normDraw;
  const oddsEdgeAway = match.probabilities.away - normAway;

  // ── Streckning-baserad edge ────────────────────────────────────────
  // Om streckning inte finns, estimera från normaliserade odds
  const streckHome = match.streckning?.home ?? normHome;
  const streckDraw = match.streckning?.draw ?? normDraw;
  const streckAway = match.streckning?.away ?? normAway;

  const strEdgeHome = match.probabilities.home - streckHome;
  const strEdgeDraw = match.probabilities.draw - streckDraw;
  const strEdgeAway = match.probabilities.away - streckAway;

  // ── Kombinerat edge per tecken ─────────────────────────────────────
  // Streckning-viktas 60% (avgörande för utdelning i pool), odds 40%
  const STRECKNING_WEIGHT = 0.60;
  const ODDS_WEIGHT = 0.40;

  const compositeHome =
    strEdgeHome * STRECKNING_WEIGHT + oddsEdgeHome * ODDS_WEIGHT;
  const compositeDraw =
    strEdgeDraw * STRECKNING_WEIGHT + oddsEdgeDraw * ODDS_WEIGHT;
  const compositeAway =
    strEdgeAway * STRECKNING_WEIGHT + oddsEdgeAway * ODDS_WEIGHT;

  const bestComposite = Math.max(compositeHome, compositeDraw, compositeAway);
  const bestSign: "1" | "X" | "2" =
    bestComposite === compositeHome
      ? "1"
      : bestComposite === compositeDraw
      ? "X"
      : "2";

  const bestOddsEdge = Math.max(oddsEdgeHome, oddsEdgeDraw, oddsEdgeAway);
  const bestStreckningEdge = Math.max(strEdgeHome, strEdgeDraw, strEdgeAway);

  // ── Skala till 0-100 ──────────────────────────────────────────────
  // Varje procentenhet composite edge adderar 2.5 poäng ovanpå baslinjen 50
  // Normaliserat: 10% edge → score 75, 20% edge → score 100
  const rawScore = 50 + bestComposite * 2.5;
  const compositeScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    oddsEdge: Math.round(bestOddsEdge * 10) / 10,
    streckningEdge: Math.round(bestStreckningEdge * 10) / 10,
    compositeScore,
    bestSign,
    bestOddsEdge: Math.round(bestOddsEdge * 10) / 10,
    bestStreckningEdge: Math.round(bestStreckningEdge * 10) / 10,
    isStreckningValue:
      match.streckning != null && bestStreckningEdge > bestOddsEdge,
  };
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

/**
 * Klassificerar matchens svårighetsgrad baserat på sannolikhetsfördelning.
 * Mer balanserade matcher = högre osäkerhet = bör garderas.
 */
export function getMatchUncertainty(
  probabilities: { home: number; draw: number; away: number }
): "låg" | "medel" | "hög" {
  const max = Math.max(
    probabilities.home,
    probabilities.draw,
    probabilities.away
  );
  if (max >= 65) return "låg";
  if (max >= 50) return "medel";
  return "hög";
}

/**
 * Beräknar skräll-poäng: hur stor är överraskningsmöjligheten?
 * Skräll = underdog har orimligt låg streckningsprocent jämfört med sannolikhet.
 *
 * Poäng > 10 = stark skräll-kandidat
 */
export function getSkrallScore(match: Match): number {
  if (!match.streckning) return 0;

  const outcomes = [
    { prob: match.probabilities.home, streck: match.streckning.home },
    { prob: match.probabilities.draw, streck: match.streckning.draw },
    { prob: match.probabilities.away, streck: match.streckning.away },
  ];

  // Bäst skräll = hög sannolikhet relativt låg streckad + underdogsstatus
  const skrallCandidates = outcomes.filter(
    (o) => o.prob < 40 && o.prob > o.streck + 5
  );

  if (skrallCandidates.length === 0) return 0;
  const best = skrallCandidates.reduce((a, b) =>
    b.prob - b.streck > a.prob - a.streck ? b : a
  );

  return Math.round((best.prob - best.streck) * 10) / 10;
}
