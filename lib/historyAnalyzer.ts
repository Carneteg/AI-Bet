import { PlacedBet, PerformanceAnalysis, StrategistReport } from "./types";

export function evaluatePerformance(bet: PlacedBet): PerformanceAnalysis {
  const ev = (bet.modelPropAtPlacement / 100) * bet.oddsTaken - 1;
  const isPositiveEvAtPlacement = ev > 0.02; // Threshold for structural edge

  // Did we beat the closing line? (A lower closing odds means we bought high value)
  const beatClosingLine = bet.oddsTaken > bet.closingOdds;
  const closingLineEdge = ((bet.oddsTaken / bet.closingOdds) - 1) * 100;

  // Grade bet purely on CLV and initial EV
  const grade = (beatClosingLine && isPositiveEvAtPlacement) ? "Good Bet" : "Bad Bet";

  // Root cause classification
  let rootCause: PerformanceAnalysis["rootCause"] = "Void";
  let keyLesson = "";
  let adjustment = "";

  if (bet.result === "WIN") {
    if (beatClosingLine) {
      rootCause = "Solid Win";
      keyLesson = "Structural edge locked in. The market agreed with our position dropping the odds, and variance aligned.";
      adjustment = "Maintain current modeling baseline. No adjustment needed.";
    } else {
      rootCause = "Lucky Win";
      keyLesson = "We lost the closing line value. The market disagreed heavily, meaning we likely missed an injury or sharp money moved against us.";
      adjustment = "Check injury reports closer to kickoff. Do not mistake a lucky variance win for a good process.";
    }
  } else if (bet.result === "LOSS") {
    if (beatClosingLine) {
      rootCause = "Positive Variance / Bad Luck";
      keyLesson = "You successfully beat the sharpest market in the world. The closing line dropped, confirming the value. Losing the game is pure short-term variance.";
      adjustment = "Do NOT panic. Do NOT adjust the model. Keep making this exact bet over 1000 trials.";
    } else {
      rootCause = "Bad Model / Missed Info";
      keyLesson = "Double failure. The bet lost AND the market steamed against us before kickoff. Our model was completely blind to situational factors or sharp information.";
      adjustment = "Review underlying data. Are we overvaluing historical form? Was there late team news we failed to price in?";
    }
  }

  return {
    bet,
    isPositiveEvAtPlacement,
    beatClosingLine,
    closingLineEdge: parseFloat(closingLineEdge.toFixed(1)),
    grade,
    rootCause,
    keyLesson,
    adjustment
  };
}

export function evaluateHistory(bets: PlacedBet[]): PerformanceAnalysis[] {
  return bets.map(evaluatePerformance);
}

export function generateStrategistReport(analysis: PerformanceAnalysis[]): StrategistReport | null {
  const totalBets = analysis.length;
  if (totalBets === 0) return null; 

  let wins = 0;
  let clvBeats = 0;
  let totalEv = 0;
  let profitUnits = 0; // Tracking Flat 1 unit stake
  let totalRisked = totalBets;
  let badModelCount = 0;

  analysis.forEach(a => {
    if (a.bet.result === "WIN") {
      wins++;
      profitUnits += (a.bet.oddsTaken - 1);
    } else {
      profitUnits -= 1;
    }

    if (a.beatClosingLine) clvBeats++;
    if (a.rootCause === "Bad Model / Missed Info") badModelCount++;

    const ev = (a.bet.modelPropAtPlacement / 100) * a.bet.oddsTaken - 1;
    totalEv += ev;
  });

  const hitRate = (wins / totalBets) * 100;
  const roi = (profitUnits / totalRisked) * 100;
  const avgEv = (totalEv / totalBets) * 100;
  const clvBeatRate = (clvBeats / totalBets) * 100;

  // Algorithmic Strategist Logic
  let keepDoing = "Maintain strict discipline on mathematically +EV early lines. You are currently capturing Closing Line Value consistently.";
  if (clvBeatRate < 50) {
    keepDoing = "Keep sizing your bets down defensively. Your CLV capture is severely lagging, so tight bankroll management is the only thing protecting you.";
  }

  let stopDoing = "Stop letting single-game variance dictate your handicapping. A win doesn't mean the model is right, and a loss doesn't mean the model is wrong. Trust the math.";
  if (badModelCount > totalBets * 0.2) {
    stopDoing = "STOP betting blindly into early market drift. Over 20% of your losses are explicitly due to bad modeling failing to foresee massive market correction before kickoff.";
  }

  let testNext = "Test cross-referencing your edge with late-week injury reports closer to kickoff to avoid the market violently correcting against you.";
  if (roi > 0 && clvBeatRate > 50) {
    testNext = "Test dialling up your fractional Kelly multiplier slightly on highly-rated EV spots. You have proven you can beat the CLV, now optimize the exploitation.";
  }

  return {
    metrics: {
      totalBets,
      hitRate: parseFloat(hitRate.toFixed(1)),
      roi: parseFloat(roi.toFixed(1)),
      avgEv: parseFloat(avgEv.toFixed(1)),
      clvBeatRate: parseFloat(clvBeatRate.toFixed(1))
    },
    actionable: {
      keepDoing,
      stopDoing,
      testNext
    }
  };
}
