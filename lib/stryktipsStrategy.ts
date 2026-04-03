/**
 * Stryktips-optimerad kupongstrategi.
 *
 * Stryktips är ett parimutuellt poolspel — du konkurrerar mot ANDRA SPELARE,
 * inte mot bookmaker. Det avgörande är att du har rätt på matcher som
 * MAJORITETEN HAR FEL PÅ.
 *
 * Nyckelinsikter från vinnande Stryktips-strategi:
 *
 * 1. SPIKAR: Matchar du bedömer med >65% sannolikhet OCH du är trygg med
 *    — de ger raddisciplin utan extra kostnad.
 *
 * 2. GARDERINGAR: Matchar med 35-55% sannolikt för favoriten — tag 2-3 tecken.
 *    Kostnad fördubblas/tredubblas per garderad match.
 *
 * 3. SKRÄLL: Matcher där streckningsprocenten kraftigt UNDERSTRECKAR en utfall
 *    du bedömer troligare. Om 10% streckar "2" men du bedömer 25% — hög EV.
 *
 * 4. OPTIMAL KUPONG: Balansera kostnad mot täckning.
 *    Professionella spelare siktar på 8-32 rader per kupong (Stryktips 13 matcher).
 */

import type { Match, Selection } from "@/data/matches";
import { calculatePoolKelly } from "@/lib/kelly";

export interface MatchStrategy {
  matchId: number;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  recommendedSigns: Selection[];
  confidence: "spik" | "gardering" | "skräll" | "avvakta";
  poolEdge: number;        // Genomsnittlig pool-edge för rekommenderade tecken
  expectedReturn: number;  // Estimerat EV (>1.0 = positivt)
  rationale: string;
}

export interface CouponStrategy {
  matches: MatchStrategy[];
  totalRows: number;
  estimatedCost: number;    // Antal rader × 1 kr (Stryktips standardinsats)
  expectedROI: number;      // Estimerad ROI i procent
  confidenceScore: number;  // 0-100, hur stark är kuponganalysen
  topSkrall: MatchStrategy[];
  topSpikar: MatchStrategy[];
}

/**
 * Analyserar varje match och rekommenderar tecken baserat på pool-edge.
 */
export function buildCouponStrategy(matches: Match[]): CouponStrategy {
  const matchStrategies: MatchStrategy[] = matches.map((match) => {
    const poolEdges = {
      home: calculatePoolKelly(
        match.streckning.home,
        match.probabilities.home
      ),
      draw: calculatePoolKelly(
        match.streckning.draw,
        match.probabilities.draw
      ),
      away: calculatePoolKelly(
        match.streckning.away,
        match.probabilities.away
      ),
    };

    // Välj tecken som har positivt pool-EV
    const valueSignsWithEV: Array<{
      sign: Selection;
      ev: number;
      edge: number;
    }> = [];

    if (poolEdges.home.isValue)
      valueSignsWithEV.push({
        sign: "1",
        ev: poolEdges.home.expectedValue,
        edge: poolEdges.home.edge,
      });
    if (poolEdges.draw.isValue)
      valueSignsWithEV.push({
        sign: "X",
        ev: poolEdges.draw.expectedValue,
        edge: poolEdges.draw.edge,
      });
    if (poolEdges.away.isValue)
      valueSignsWithEV.push({
        sign: "2",
        ev: poolEdges.away.expectedValue,
        edge: poolEdges.away.edge,
      });

    // Sortera på EV, ta de med positivt värde
    valueSignsWithEV.sort((a, b) => b.ev - a.ev);

    let recommendedSigns: Selection[];
    let confidence: MatchStrategy["confidence"];
    let rationale: string;

    if (valueSignsWithEV.length === 0) {
      // Ingen klar pool-edge — välj favoriten som minimum
      const favSign: Selection =
        match.probabilities.home >= match.probabilities.away &&
        match.probabilities.home >= match.probabilities.draw
          ? "1"
          : match.probabilities.away >= match.probabilities.draw
          ? "2"
          : "X";
      recommendedSigns = [favSign];
      confidence = "avvakta";
      rationale = "Ingen tydlig pool-edge — välj favorit som minimum.";
    } else if (
      valueSignsWithEV.length === 1 &&
      valueSignsWithEV[0].ev > 1.1
    ) {
      // Tydlig enskild pool-vinnarkandidat
      recommendedSigns = [valueSignsWithEV[0].sign];
      const maxProb = Math.max(
        match.probabilities.home,
        match.probabilities.draw,
        match.probabilities.away
      );
      confidence =
        maxProb >= 60 && valueSignsWithEV[0].edge > 5
          ? "spik"
          : valueSignsWithEV[0].edge >= 8 &&
            match.probabilities[
              valueSignsWithEV[0].sign === "1"
                ? "home"
                : valueSignsWithEV[0].sign === "X"
                ? "draw"
                : "away"
            ] < 35
          ? "skräll"
          : "gardering";
      rationale = `Pool-edge ${valueSignsWithEV[0].edge.toFixed(1)}pp. EV ${valueSignsWithEV[0].ev.toFixed(2)}x.`;
    } else {
      // Flera tecken med pool-value — garderas
      recommendedSigns = valueSignsWithEV.map((v) => v.sign);
      confidence = "gardering";
      const avgEV =
        valueSignsWithEV.reduce((s, v) => s + v.ev, 0) /
        valueSignsWithEV.length;
      rationale = `${valueSignsWithEV.length} tecken med pool-value. Snitt EV ${avgEV.toFixed(2)}x.`;
    }

    const avgPoolEdge =
      valueSignsWithEV.length > 0
        ? valueSignsWithEV.reduce((s, v) => s + v.edge, 0) /
          valueSignsWithEV.length
        : 0;

    const avgEV =
      valueSignsWithEV.length > 0
        ? valueSignsWithEV.reduce((s, v) => s + v.ev, 0) /
          valueSignsWithEV.length
        : 0.85;

    return {
      matchId: match.id,
      matchNumber: match.matchNumber,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      recommendedSigns,
      confidence,
      poolEdge: Math.round(avgPoolEdge * 10) / 10,
      expectedReturn: Math.round(avgEV * 100) / 100,
      rationale,
    };
  });

  // Totala rader
  const totalRows = matchStrategies.reduce(
    (acc, m) => acc * (m.recommendedSigns.length || 1),
    1
  );

  // Estimerad ROI: Stryktips-pool delar ut 65% av insatserna
  // Vår EV per match kombineras multiplikativt i poolmodellen
  const matchEVs = matchStrategies.map((m) => m.expectedReturn);
  const combinedEV = matchEVs.reduce((acc, ev) => acc * Math.max(0.5, ev), 1);
  const poolPayout = 0.65; // Svenska Spel behåller 35%
  const estimatedROI = (combinedEV * poolPayout - 1) * 100;

  // Konfidenspoäng: baseras på antal matcher med stark pool-edge
  const strongEdgeMatches = matchStrategies.filter(
    (m) => m.poolEdge >= 5 || m.confidence === "skräll"
  ).length;
  const confidenceScore = Math.min(
    100,
    Math.round(50 + (strongEdgeMatches / matches.length) * 50)
  );

  const topSkrall = matchStrategies
    .filter((m) => m.confidence === "skräll")
    .sort((a, b) => b.poolEdge - a.poolEdge);

  const topSpikar = matchStrategies
    .filter((m) => m.confidence === "spik")
    .sort((a, b) => b.expectedReturn - a.expectedReturn);

  return {
    matches: matchStrategies,
    totalRows,
    estimatedCost: totalRows * 1,
    expectedROI: Math.round(estimatedROI * 10) / 10,
    confidenceScore,
    topSkrall,
    topSpikar,
  };
}

/**
 * Beräknar minsta kupongen som täcker alla högt rankade skrällar och spikar.
 * Garderar strategiskt för att hålla radantalet hanterbart.
 *
 * Målsättning: 8-32 rader (typisk professionell spelprofil för Stryktips).
 */
export function buildMinimumValueCoupon(
  strategy: CouponStrategy,
  maxRows = 32
): Record<number, Selection[]> {
  const selections: Record<number, Selection[]> = {};

  for (const m of strategy.matches) {
    // Börja med de rekommenderade tecknen
    let signs = [...m.recommendedSigns];

    // Om totalRader inte överstiger maxRows efter tillägg, ta med garderingar
    const projectedRows = Object.values({ ...selections, [m.matchId]: signs })
      .reduce((acc, s) => acc * (s.length || 1), 1);

    if (projectedRows > maxRows && signs.length > 1) {
      // Reducera till starkaste tecknet
      signs = [signs[0]];
    }

    selections[m.matchId] = signs;
  }

  return selections;
}

/**
 * Klassificerar en match baserat på streckningsprofil.
 * Hjälper att snabbt identifiera var publiken har störst fel.
 */
export function classifyStreckningProfile(match: Match): {
  type: "klar_favorit" | "overstreckad_favorit" | "jämn" | "skräll_möjlighet";
  description: string;
} {
  const maxProb = Math.max(
    match.probabilities.home,
    match.probabilities.draw,
    match.probabilities.away
  );
  const maxStreck = Math.max(
    match.streckning.home,
    match.streckning.draw,
    match.streckning.away
  );

  // Hitta om favoriten är överstreckat
  const favoriteProb =
    match.probabilities.home === maxProb
      ? match.probabilities.home
      : match.probabilities.away === maxProb
      ? match.probabilities.away
      : match.probabilities.draw;
  const favoriteStreck =
    match.streckning.home === maxStreck
      ? match.streckning.home
      : match.streckning.away === maxStreck
      ? match.streckning.away
      : match.streckning.draw;

  const overstreckad = favoriteStreck - favoriteProb;

  if (maxProb >= 65 && overstreckad < 10) {
    return {
      type: "klar_favorit",
      description: "Tydlig favorit med korrekt streckning",
    };
  }
  if (overstreckad >= 10) {
    return {
      type: "overstreckad_favorit",
      description: `Favorit överstreckas med ${overstreckad}pp — undvikta värdet`,
    };
  }

  const minProb = Math.min(
    match.probabilities.home,
    match.probabilities.draw,
    match.probabilities.away
  );
  const minStreck = Math.min(
    match.streckning.home,
    match.streckning.draw,
    match.streckning.away
  );
  if (minProb > 15 && minStreck < minProb - 7) {
    return {
      type: "skräll_möjlighet",
      description: "Underdog understreckad — skräll-kandidat",
    };
  }

  return {
    type: "jämn",
    description: "Jämn match utan tydlig streckning-edge",
  };
}
