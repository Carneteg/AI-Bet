/**
 * Dixon-Coles korrigerad Poisson-modell för fotbollsmålprognoser.
 *
 * Starka bettingspelare vet att råa vinstfrekvenser är missvisande —
 * Poisson-fördelningen av mål ger en mycket mer exakt sannolikhetsbild.
 *
 * Dixon-Cole-korrektionen för låga poäng (0-0, 1-0, 0-1, 1-1) kompenserar
 * för att mål i dessa utfall är korrelerade (inte oberoende Poisson-händelser).
 */

export interface TeamRatings {
  attack: number;   // Attackstyrka (normaliserad mot genomsnitt = 1.0)
  defense: number;  // Försvarsstyrka (lägre = starkare försvar, normaliserat mot 1.0)
}

export interface PoissonMatchResult {
  home: number;   // Sannolikhet hemmaseger (0-1)
  draw: number;   // Sannolikhet oavgjort (0-1)
  away: number;   // Sannolikhet bortaseger (0-1)
  expectedGoalsHome: number;
  expectedGoalsAway: number;
  scoreProbabilities: number[][];  // [hemma_mål][borta_mål] upp till 6x6
}

// Ligagenomsnittliga mål per match (hemma/borta)
const LEAGUE_HOME_GOALS = 1.5;
const LEAGUE_AWAY_GOALS = 1.1;
const HOME_ADVANTAGE = 1.18; // Generell hemmafördelsfaktor

/**
 * Poisson PMF: P(X = k | lambda)
 */
function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

/**
 * Dixon-Coles korrektionsfaktor (rho) för låga scoreline-kombinationer.
 * Justerar för att 0-0 och 1-1 underrepresenteras resp. 1-0 och 0-1 överrepresenteras
 * i ren Poisson.
 *
 * @param homeGoals - Hemmamål i den specifika scoreline
 * @param awayGoals - Bortamål i den specifika scoreline
 * @param lambdaHome - Förväntade hemmamål
 * @param lambdaAway - Förväntade bortamål
 * @param rho - Korrelationsparameter (typiskt -0.1)
 */
function dixonColesTau(
  homeGoals: number,
  awayGoals: number,
  lambdaHome: number,
  lambdaAway: number,
  rho = -0.1
): number {
  if (homeGoals === 0 && awayGoals === 0)
    return 1 - lambdaHome * lambdaAway * rho;
  if (homeGoals === 1 && awayGoals === 0)
    return 1 + lambdaAway * rho;
  if (homeGoals === 0 && awayGoals === 1)
    return 1 + lambdaHome * rho;
  if (homeGoals === 1 && awayGoals === 1)
    return 1 - rho;
  return 1;
}

/**
 * Beräknar matchutfallssannolikheter med Dixon-Coles justerad Poisson-modell.
 *
 * @param homeAttack  - Hemmalagets attackstyrka (1.0 = genomsnitt)
 * @param homeDefense - Hemmalagets försvarsstyrka (1.0 = genomsnitt)
 * @param awayAttack  - Bortalaget attackstyrka
 * @param awayDefense - Bortalaget försvarsstyrka
 * @param homeAdvantage - Hemmaplansfördel (default 1.18)
 * @param maxGoals    - Max mål per lag att beräkna (default 6)
 */
export function calculatePoissonOutcomes(
  homeAttack: number,
  homeDefense: number,
  awayAttack: number,
  awayDefense: number,
  homeAdvantage = HOME_ADVANTAGE,
  maxGoals = 6
): PoissonMatchResult {
  // Förväntade mål baserat på attack/defensstyrkor och hemmaplan
  const lambdaHome =
    homeAttack * awayDefense * LEAGUE_HOME_GOALS * homeAdvantage;
  const lambdaAway =
    awayAttack * homeDefense * LEAGUE_AWAY_GOALS;

  // Bygg sannolikhetsmatris för varje scoreline
  const scoreMatrix: number[][] = [];
  for (let h = 0; h <= maxGoals; h++) {
    scoreMatrix[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      const p =
        poissonPMF(h, lambdaHome) *
        poissonPMF(a, lambdaAway) *
        dixonColesTau(h, a, lambdaHome, lambdaAway);
      scoreMatrix[h][a] = p;
    }
  }

  // Normalisera matrisen (Dixon-Coles kan skapa litet avvikelse från 1.0)
  let total = 0;
  for (let h = 0; h <= maxGoals; h++)
    for (let a = 0; a <= maxGoals; a++)
      total += scoreMatrix[h][a];
  for (let h = 0; h <= maxGoals; h++)
    for (let a = 0; a <= maxGoals; a++)
      scoreMatrix[h][a] /= total;

  // Summera till 1X2-sannolikheter
  let home = 0, draw = 0, away = 0;
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      if (h > a) home += scoreMatrix[h][a];
      else if (h === a) draw += scoreMatrix[h][a];
      else away += scoreMatrix[h][a];
    }
  }

  return {
    home: Math.round(home * 1000) / 1000,
    draw: Math.round(draw * 1000) / 1000,
    away: Math.round(away * 1000) / 1000,
    expectedGoalsHome: Math.round(lambdaHome * 100) / 100,
    expectedGoalsAway: Math.round(lambdaAway * 100) / 100,
    scoreProbabilities: scoreMatrix,
  };
}

/**
 * Konverterar formdata (V/F/O-sträng) och mål-genomsnitt till attack/defense-ratings.
 * Enkel regression från historik som approximerar lagstyrka.
 *
 * @param formString - T.ex. "VVVOV" (sista 5 matcher)
 * @param goalsForAvg - Genomsnittliga mål per match
 * @param goalsAgainstAvg - Genomsnittliga insläppta mål per match
 * @param isHome - Om vi räknar hemma- eller bortaprestationer
 */
export function deriveTeamRatings(
  formString: string,
  goalsForAvg: number,
  goalsAgainstAvg: number,
  isHome: boolean
): TeamRatings {
  // Räkna formpoäng (V=3, O=1, F=0) och normalisera
  let formScore = 0;
  const results = formString.split("");
  for (const r of results) {
    if (r === "V") formScore += 3;
    else if (r === "O") formScore += 1;
  }
  const maxFormScore = results.length * 3;
  const formFactor = maxFormScore > 0 ? formScore / maxFormScore : 0.5;

  // Attackstyrka från mål + form, normaliserat mot liggagenomsnitt
  const leagueGoalAvg = isHome ? LEAGUE_HOME_GOALS : LEAGUE_AWAY_GOALS;
  const rawAttack = goalsForAvg / leagueGoalAvg;
  // Forma påverkar med ±15%
  const attack = rawAttack * (0.85 + formFactor * 0.30);

  // Defensivstyrka — lägre = bättre (1.0 = liggagenomsnitt)
  const leagueAgainstAvg = isHome ? LEAGUE_AWAY_GOALS : LEAGUE_HOME_GOALS;
  const rawDefense = goalsAgainstAvg / leagueAgainstAvg;
  const defense = rawDefense * (1.15 - formFactor * 0.30);

  return {
    attack: Math.max(0.3, Math.min(2.5, Math.round(attack * 100) / 100)),
    defense: Math.max(0.3, Math.min(2.5, Math.round(defense * 100) / 100)),
  };
}

/**
 * Beräknar Poisson-baserade sannolikheter utifrån lagstatistik.
 * Returnerar 1X2-procentsatser (0-100).
 */
export function getPoissonProbabilities(
  homeGoalsForAvg: number,
  homeGoalsAgainstAvg: number,
  homeForm: string,
  awayGoalsForAvg: number,
  awayGoalsAgainstAvg: number,
  awayForm: string,
  homeAdvantageFactor = HOME_ADVANTAGE
): { home: number; draw: number; away: number } {
  const homeRatings = deriveTeamRatings(
    homeForm,
    homeGoalsForAvg,
    homeGoalsAgainstAvg,
    true
  );
  const awayRatings = deriveTeamRatings(
    awayForm,
    awayGoalsForAvg,
    awayGoalsAgainstAvg,
    false
  );

  const result = calculatePoissonOutcomes(
    homeRatings.attack,
    homeRatings.defense,
    awayRatings.attack,
    awayRatings.defense,
    homeAdvantageFactor
  );

  return {
    home: Math.round(result.home * 100),
    draw: Math.round(result.draw * 100),
    away: Math.round(result.away * 100),
  };
}

/**
 * Vanligaste scorelines: returnerar topp-N med sannolikheter.
 */
export function getTopScorelines(
  result: PoissonMatchResult,
  topN = 5
): Array<{ score: string; probability: number }> {
  const all: Array<{ score: string; probability: number }> = [];
  const matrix = result.scoreProbabilities;
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      all.push({
        score: `${h}-${a}`,
        probability: Math.round(matrix[h][a] * 1000) / 10,
      });
    }
  }
  return all.sort((a, b) => b.probability - a.probability).slice(0, topN);
}
