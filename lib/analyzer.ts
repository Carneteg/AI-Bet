import { SportEvent, Opportunity, SlateAngle } from "./types";
import { Match } from "@/data/matches";

/**
 * Maps the live/Stryktips Match data into the generic SportEvent structure used by the AI Analyzer
 */
export function mapMatchToSportEvent(match: Match): SportEvent {
  // Find which side has largest positive edge (probability > streckning)
  const homeEdge = match.probabilities.home - match.streckning.home;
  const awayEdge = match.probabilities.away - match.streckning.away;
  const drawEdge = match.probabilities.draw - match.streckning.draw;
  
  let selection = match.homeTeam;
  let currentOdds = match.odds.home;
  let isDrift = false;
  let edgeDiff = homeEdge;
  
  if (awayEdge > homeEdge && awayEdge > drawEdge) {
    selection = match.awayTeam;
    currentOdds = match.odds.away;
    isDrift = match.streckning.away < match.probabilities.away;
    edgeDiff = awayEdge;
  } else if (drawEdge > homeEdge && drawEdge > awayEdge) {
    selection = "Draw";
    currentOdds = match.odds.draw;
    isDrift = match.streckning.draw < match.probabilities.draw;
    edgeDiff = drawEdge;
  } else {
    isDrift = match.streckning.home < match.probabilities.home;
    edgeDiff = homeEdge;
  }

  // To visualize the "inefficiency" dynamically via odds on the dashboard, 
  // we simulate opening odds based on the streckning (public opinion) versus the actual implied odds.
  const streckningProb = Math.min(99, Math.max(1, (1 / currentOdds) * 100 - edgeDiff));
  const syntheticOpeningOdds = 100 / streckningProb;

  return {
    id: `match_${match.id}`,
    name: `${match.homeTeam} vs. ${match.awayTeam}`,
    sport: "Football",
    leagueOrVenue: match.league,
    startTime: `${match.date} ${match.time}`,
    odds: {
      market: "1X2 (Match Winner)",
      selection,
      openingOdds: parseFloat(syntheticOpeningOdds.toFixed(2)),
      currentOdds,
    },
    context: {
      publicBias: match.analysis.split(".").find(s => s.includes("streckning") || s.includes("över"))?.trim() || "Public streckning deviates from mathematical baseline.",
      underlyingMetrics: `Data indicates xG ${match.xg.home} vs ${match.xg.away}. Form indicates ${match.probabilities.home}% / ${match.probabilities.draw}% / ${match.probabilities.away}%.`,
      motivationMismatch: Math.abs(match.motivationHome - match.motivationAway) > 1,
    }
  };
}

/**
 * Calculates implied probability from decimal odds
 */
function getImpliedProbability(odds: number): number {
  return (1 / odds) * 100;
}

/**
 * Analyzes a single event to determine if there's a market inefficiency.
 */
export function analyzeEvent(event: SportEvent, match: Match): Opportunity {
  const { odds, context } = event;

  const openingProb = getImpliedProbability(odds.openingOdds);
  const currentProb = getImpliedProbability(odds.currentOdds);
  const probabilityShift = currentProb - openingProb;
  
  let inefficiencyScore = 0;
  let marketBelief = "";
  let inefficiencyReasoning = "";

  const absShift = Math.abs(probabilityShift);
  if (absShift > 5) inefficiencyScore += 20;
  else if (absShift > 2) inefficiencyScore += 10;

  // Contextual logic checking
  if (context.motivationMismatch) {
      inefficiencyScore += 50; 
      marketBelief = `${context.publicBias}`;
      inefficiencyReasoning = `Sharp money respects situation over talent. This is a motivation variance spot. ${context.underlyingMetrics}. True value lies on ${odds.selection}.`;
  }
  else if (context.underlyingMetrics?.includes("xG")) {
      inefficiencyScore += 40;
      marketBelief = `${context.publicBias}`;
      inefficiencyReasoning = `Looking strictly at the underlying expected goals: ${context.underlyingMetrics}. The true win probability is being suppressed by narrative.`;
  }
  else {
      inefficiencyScore += 20;
      marketBelief = `Market is pricing ${odds.selection} based on standard form. ${context.publicBias}`;
      inefficiencyReasoning = `Edge found by examining the implied probability gap. ${context.underlyingMetrics}`;
  }

  // Generate Sharp Breakdown
  const trueProbStats = `Model: ${match.homeTeam} ${match.probabilities.home}%, Draw ${match.probabilities.draw}%, ${match.awayTeam} ${match.probabilities.away}% | Market (Streckning): ${match.homeTeam} ${match.streckning.home}%, Draw ${match.streckning.draw}%, ${match.awayTeam} ${match.streckning.away}%`;
  
  let overvalued = "The market is heavily overvaluing historical 38-game talent disparity and ignoring the specific situational spot today.";
  if (match.probabilities.home < match.streckning.home && match.streckning.home > 50) {
    overvalued = `${match.homeTeam} is heavily over-streckad. The public is blindly backing the home favorite despite underlying metrics suggesting weakness.`;
  } else if (match.probabilities.away < match.streckning.away && match.streckning.away > 50) {
    overvalued = `${match.awayTeam} is heavily over-streckad. The public assumes an easy away win on reputation alone.`;
  }

  let undervalued = `Value lies with ${odds.selection}. The situational desperation and structural matchup create a mathematical floor higher than the market thinks.`;
  if (context.motivationMismatch) {
    undervalued = `Motivation gap. A team fighting for survival or with a rest advantage automatically outperforms their seasonal baseline.`;
  } else if (match.xg.home > match.xg.away && match.probabilities.home > match.streckning.home) {
    undervalued = `${match.homeTeam}'s underlying xG performance is elite. Their inability to over-finish is suppressing their public backing, creating massive equity.`;
  }

  let uncertainty = match.motivationHome === 5 && match.motivationAway === 5 
    ? "Both teams are highly motivated. A red card or early penalty completely ruins the variance." 
    : "An early goal from the heavy favorite forcing the underdog to abandon their low block.";

  // Generate Quant Breakdown
  const outcomes = [
    { selection: match.homeTeam, odds: match.odds.home, modelProb: match.probabilities.home },
    { selection: "Draw", odds: match.odds.draw, modelProb: match.probabilities.draw },
    { selection: match.awayTeam, odds: match.odds.away, modelProb: match.probabilities.away },
  ].map(o => {
    const impliedProb = (1 / o.odds) * 100;
    const edge = o.modelProb - impliedProb;
    const ev = (o.modelProb / 100) * o.odds - 1;

    // Fractional Kelly & Risk Manager Logic
    let kellyPercentage = 0;
    let isRiskCapped = false;
    
    if (ev > 0.01) {
      const b = o.odds - 1;
      const p = o.modelProb / 100;
      const q = 1 - p;
      const f = (b * p - q) / b; // Standard Kelly Fraction
      const fractionalKelly = f * 0.25; // 0.25 Fractional Kelly applied
      const rawPercentage = fractionalKelly * 100;
      
      if (rawPercentage > 2.0) {
        kellyPercentage = 2.0; // Strict maximum 2% bankroll rule
        isRiskCapped = true;
      } else {
        kellyPercentage = rawPercentage;
      }
    }

    return {
      selection: o.selection,
      odds: o.odds,
      impliedProb: parseFloat(impliedProb.toFixed(1)),
      modelProb: o.modelProb,
      edge: parseFloat(edge.toFixed(1)),
      ev: parseFloat(ev.toFixed(3)),
      kellyPercentage: parseFloat(kellyPercentage.toFixed(2)),
      isRiskCapped
    };
  });

  const positiveEV = outcomes.filter(o => o.ev > 0.01).map(o => o.selection);
  const conclusion = positiveEV.length > 0 
    ? `Positive EV identified on: ${positiveEV.join(" and ")}` 
    : "NO BET";

  return {
    eventId: event.id,
    event,
    inefficiencyScore: Math.min(inefficiencyScore, 99),
    marketBelief,
    inefficiencyReasoning,
    sharpBreakdown: {
      trueProbStats,
      overvalued,
      undervalued,
      uncertainty
    },
    quantBreakdown: {
      outcomes,
      conclusion
    }
  };
}

export function analyzeMarkets(matches: Match[]): Opportunity[] {
  return matches.map(match => {
    const event = mapMatchToSportEvent(match);
    return analyzeEvent(event, match);
  }).sort((a, b) => b.inefficiencyScore - a.inefficiencyScore);
}

export function analyzeSlate(matches: Match[]): SlateAngle[] {
  const angles: SlateAngle[] = [];

  // Theme 1: Public Overreaction to Favorites
  const overvaluedFavorites = matches.filter(m => 
    (m.probabilities.home < 50 && m.streckning.home > 55) || 
    (m.probabilities.away < 50 && m.streckning.away > 55)
  );
  if (overvaluedFavorites.length > 0) {
    angles.push({
      title: "Public Overreaction to Favorites",
      description: "Recreational bettors are heavily backing 'name-brand' favorites despite underlying statistical models giving them less than a 50% true win probability. This creates massive baseline EV on the opposing sides.",
      applicableMatches: overvaluedFavorites.map(m => `${m.homeTeam} vs ${m.awayTeam}`)
    });
  }

  // Theme 2: Severe Situational Inequality
  const motivationMismatches = matches.filter(m => Math.abs(m.motivationHome - m.motivationAway) > 1);
  if (motivationMismatches.length > 0) {
    angles.push({
      title: "Severe Situational Inequality",
      description: "Late-season dynamics or fixture congestion has created structural motivation mismatches. Talent evaluates at a steep discount when one team is desperate and the other is rotating or safe.",
      applicableMatches: motivationMismatches.map(m => `${m.homeTeam} vs ${m.awayTeam}`)
    });
  }

  // Theme 3: Misleading Form Traps (Underlying Data over Form)
  const misleadingData = matches.filter(m => 
    (m.xg.home > m.xg.away && m.probabilities.home < m.streckning.home) || 
    (m.xg.away > m.xg.home && m.probabilities.away < m.streckning.away)
  );
  if (misleadingData.length > 0) {
    angles.push({
      title: "Misleading Form Traps",
      description: "The market is punishing teams for bad recent visual form or unlucky outcomes. However, their underlying robust Expected Goals (xG) metrics indicate they are playing effectively and positive regression is imminent.",
      applicableMatches: misleadingData.map(m => `${m.homeTeam} vs ${m.awayTeam}`)
    });
  }

  // Theme 4: Undervalued Away Dogs (Fallback if needed)
  if (angles.length < 3) {
    const awayDogs = matches.filter(m => m.probabilities.away > 35 && m.streckning.away < 25);
    if (awayDogs.length > 0) {
      angles.push({
        title: "High-Equity Away Underdogs",
        description: "Public money typically avoids backing away underdogs. The models have identified teams pulling structural value simply because the market is irrationally biased towards home field advantage regardless of squad parity.",
        applicableMatches: awayDogs.map(m => `${m.homeTeam} vs ${m.awayTeam}`)
      });
    }
  }

  // Return strictly top 3 angles
  return angles.slice(0, 3);
}
