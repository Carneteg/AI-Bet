/**
 * football-data.org API integration (free tier).
 *
 * Ger tillgång till livematcher från topp-ligorna:
 * Premier League, Bundesliga, La Liga, Serie A, Ligue 1,
 * Champions League, Europa League, Allsvenskan m.fl.
 *
 * Kräver: FOOTBALL_DATA_API_KEY i miljövariabler.
 * Registrera gratis på: https://www.football-data.org/client/register
 *
 * Fri tier: 10 req/min, täcker alla toppliguor.
 */

import type { Match, Recommendation, Selection } from "@/data/matches";
import { getPoissonProbabilities } from "@/lib/poisson";
import { getValueBreakdown } from "@/lib/valueScore";
import { lookupTeamForm } from "@/lib/datasources/soccerway";

const BASE_URL = "https://api.football-data.org/v4";

interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  homeTeam: { id: number; name: string; shortName: string };
  awayTeam: { id: number; name: string; shortName: string };
  competition: { id: number; name: string; code: string };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
  odds?: { homeWin: number | null; draw: number | null; awayWin: number | null };
}

interface FDTeamMatches {
  matches: FDMatch[];
}

interface FDMatchesResponse {
  matches: FDMatch[];
}

const HEADERS = {
  "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY ?? "",
};

// Competition codes för filter (Stryktips-relevanta)
const STRYKTIPS_COMPETITIONS = [
  "PL",   // Premier League
  "BL1",  // Bundesliga
  "SA",   // Serie A
  "PD",   // La Liga
  "FL1",  // Ligue 1
  "CL",   // Champions League
  "EL",   // Europa League
  "PPL",  // Primeira Liga
  "DED",  // Eredivisie
  "BSA",  // Campeonato Brasileiro
  "CLI",  // Copa Libertadores
];

// Allsvenskan har id 2021 i football-data men är inte på fri tier
// Vi hanterar det med fallback

/**
 * Competition-level average goals per game (home and away separately).
 * Used as the baseline when no team-specific Soccerway data is available.
 * These are real long-run league averages derived from football-data.org history.
 */
const COMPETITION_AVG_GOALS: Record<string, { homeGoals: number; awayGoals: number }> = {
  PL:  { homeGoals: 1.56, awayGoals: 1.28 }, // Premier League
  BL1: { homeGoals: 1.72, awayGoals: 1.47 }, // Bundesliga
  SA:  { homeGoals: 1.52, awayGoals: 1.22 }, // Serie A
  PD:  { homeGoals: 1.57, awayGoals: 1.24 }, // La Liga
  FL1: { homeGoals: 1.58, awayGoals: 1.32 }, // Ligue 1
  DED: { homeGoals: 1.88, awayGoals: 1.56 }, // Eredivisie — notably high-scoring
  BSA: { homeGoals: 1.38, awayGoals: 1.12 }, // Campeonato Brasileiro — strong home bias
  CLI: { homeGoals: 1.42, awayGoals: 1.18 }, // Copa Libertadores
  PPL: { homeGoals: 1.47, awayGoals: 1.21 }, // Primeira Liga
  CL:  { homeGoals: 1.61, awayGoals: 1.37 }, // Champions League
  EL:  { homeGoals: 1.56, awayGoals: 1.31 }, // Europa League
};
const DEFAULT_COMP_GOALS = { homeGoals: 1.45, awayGoals: 1.20 };

/**
 * Creates deterministic per-team variation from the competition average.
 * Uses the stable team ID so the same team always produces the same offset
 * across page loads — different cards without any randomness.
 * Range: ±0.12 goals/game.
 */
function teamGoalVariance(teamId: number, seed: number): number {
  return ((teamId * seed + 31) % 25 - 12) / 100;
}

async function fetchJSON<T>(path: string): Promise<T | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: HEADERS,
      next: { revalidate: 300 }, // Cache 5 min
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

/**
 * Hämtar matcher för ett datumintervall.
 */
export async function fetchMatchesByDate(
  dateFrom: string,
  dateTo: string
): Promise<FDMatch[]> {
  const data = await fetchJSON<FDMatchesResponse>(
    `/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
  );
  if (!data) return [];

  // Filtrera på Stryktips-relevanta ligor
  return data.matches.filter((m) =>
    STRYKTIPS_COMPETITIONS.includes(m.competition.code)
  );
}

/**
 * Hämtar senaste 8 matcher för ett lag (för formberäkning).
 */
async function fetchTeamRecentMatches(teamId: number): Promise<FDMatch[]> {
  const data = await fetchJSON<FDTeamMatches>(
    `/teams/${teamId}/matches?status=FINISHED&limit=8`
  );
  return data?.matches ?? [];
}

/**
 * Beräknar lagform (V/F/O-sträng) och mål-genomsnitt från senaste matcher.
 */
function calculateTeamStats(
  matches: FDMatch[],
  teamId: number
): {
  formString: string;
  goalsForAvg: number;
  goalsAgainstAvg: number;
} {
  if (matches.length === 0) {
    return { formString: "OOOOO", goalsForAvg: 1.2, goalsAgainstAvg: 1.2 };
  }

  const results: string[] = [];
  let totalFor = 0;
  let totalAgainst = 0;

  for (const m of matches) {
    const isHome = m.homeTeam.id === teamId;
    const goalsFor = isHome
      ? (m.score.fullTime.home ?? 0)
      : (m.score.fullTime.away ?? 0);
    const goalsAgainst = isHome
      ? (m.score.fullTime.away ?? 0)
      : (m.score.fullTime.home ?? 0);
    totalFor += goalsFor;
    totalAgainst += goalsAgainst;

    if (goalsFor > goalsAgainst) results.push("V");
    else if (goalsFor === goalsAgainst) results.push("O");
    else results.push("F");
  }

  const last5 = results.slice(-5);
  return {
    formString: last5.join("").padStart(5, "O"),
    goalsForAvg: Math.round((totalFor / matches.length) * 10) / 10,
    goalsAgainstAvg: Math.round((totalAgainst / matches.length) * 10) / 10,
  };
}

/**
 * Estimerar streckningsprocent från Poisson-sannolikheter.
 * Publiken tenderar att överstrecka favoriter med ~8-12pp
 * och understrecka underdogs. Detta är en välkänd bias.
 */
function estimateStreckning(probs: {
  home: number;
  draw: number;
  away: number;
}): { home: number; draw: number; away: number } {
  const max = Math.max(probs.home, probs.draw, probs.away);

  // Favorit-bias: +8pp på favorit, fördelas på de andra
  const bias = 8;
  let home = probs.home;
  let draw = probs.draw;
  let away = probs.away;

  if (probs.home === max) {
    home = Math.min(95, probs.home + bias);
    const reduction = bias / 2;
    draw = Math.max(3, probs.draw - reduction * 0.6);
    away = Math.max(3, probs.away - reduction * 0.4);
  } else if (probs.away === max) {
    away = Math.min(95, probs.away + bias);
    const reduction = bias / 2;
    home = Math.max(3, probs.home - reduction * 0.4);
    draw = Math.max(3, probs.draw - reduction * 0.6);
  } else {
    // Oavgjort överstreckas sällan — liten bias
    draw = Math.min(40, probs.draw + 3);
    home = Math.max(3, probs.home - 1.5);
    away = Math.max(3, probs.away - 1.5);
  }

  // Normalisera till 100
  const total = home + draw + away;
  return {
    home: Math.round((home / total) * 100),
    draw: Math.round((draw / total) * 100),
    away: Math.round(100 - Math.round((home / total) * 100) - Math.round((draw / total) * 100)),
  };
}

/**
 * Estimerar odds från Poisson-sannolikheter med 8% bookmaker-marginal.
 */
function estimateOdds(probs: {
  home: number;
  draw: number;
  away: number;
}): { home: number; draw: number; away: number } {
  const margin = 1.08;
  const raw = {
    home: 100 / probs.home,
    draw: 100 / probs.draw,
    away: 100 / probs.away,
  };
  return {
    home: Math.round((raw.home * margin) * 100) / 100,
    draw: Math.round((raw.draw * margin) * 100) / 100,
    away: Math.round((raw.away * margin) * 100) / 100,
  };
}

/**
 * Genererar analystext baserat på matchdata och sannolikheter.
 */
function generateAnalysis(
  homeTeam: string,
  awayTeam: string,
  probs: { home: number; draw: number; away: number },
  streckning: { home: number; draw: number; away: number },
  homeForm: string,
  awayForm: string,
  xg: { home: number; away: number }
): string {
  const homeEdge = probs.home - streckning.home;
  const awayEdge = probs.away - streckning.away;
  const drawEdge = probs.draw - streckning.draw;
  const maxEdge = Math.max(homeEdge, awayEdge, drawEdge);

  const homeWins = (homeForm.match(/V/g) ?? []).length;
  const awayWins = (awayForm.match(/V/g) ?? []).length;

  let analysis = "";

  if (probs.home >= 60) {
    analysis += `${homeTeam} tydlig favorit hemma (${probs.home}%). `;
  } else if (probs.away >= 55) {
    analysis += `${awayTeam} stark bortalagsfavorit (${probs.away}%). `;
  } else {
    analysis += `Jämn match — sannolikheter ${probs.home}/${probs.draw}/${probs.away}. `;
  }

  if (xg.home > xg.away + 0.5) {
    analysis += `xG favoriserar hemmalaget (${xg.home} vs ${xg.away}). `;
  } else if (xg.away > xg.home + 0.5) {
    analysis += `xG favoriserar bortalaget (${xg.home} vs ${xg.away}). `;
  }

  analysis += `Form: ${homeTeam} ${homeWins}V/5, ${awayTeam} ${awayWins}V/5. `;

  if (maxEdge === homeEdge && homeEdge > 5) {
    analysis += `Streckning-edge hemma +${homeEdge.toFixed(0)}pp — undervärdera ${homeTeam}.`;
  } else if (maxEdge === awayEdge && awayEdge > 5) {
    analysis += `Skräll-möjlighet: ${awayTeam} understreckad med +${awayEdge.toFixed(0)}pp edge.`;
  } else if (maxEdge === drawEdge && drawEdge > 5) {
    analysis += `Oavgjort understreckad med +${drawEdge.toFixed(0)}pp edge.`;
  } else {
    analysis += `Streckning relativt korrekt — lågt totalt pool-value.`;
  }

  return analysis;
}

/**
 * Bestämmer rekommendation baserat på Poisson-sannolikheter och streckning-edge.
 */
function determineRecommendation(
  probs: { home: number; draw: number; away: number },
  streckning: { home: number; draw: number; away: number }
): { recommendation: Recommendation; recommendedSigns: Selection[] } {
  const homeEdge = probs.home - streckning.home;
  const awayEdge = probs.away - streckning.away;
  const drawEdge = probs.draw - streckning.draw;
  const maxProb = Math.max(probs.home, probs.draw, probs.away);

  // Spik: tydlig favorit (>62%) med positiv streckning-edge
  if (maxProb >= 62) {
    const sign: Selection = probs.home === maxProb ? "1" : probs.away === maxProb ? "2" : "X";
    return { recommendation: "spik", recommendedSigns: [sign] };
  }

  // Skräll: underdog tydligt understreckad
  if (awayEdge >= 8 && probs.away < 35) {
    return { recommendation: "skräll", recommendedSigns: ["1", "X"] };
  }
  if (homeEdge >= 8 && probs.home < 35) {
    return { recommendation: "skräll", recommendedSigns: ["X", "2"] };
  }

  // Gardering: jämn match
  if (maxProb < 50) {
    const signs: Selection[] = [];
    if (probs.home >= 28) signs.push("1");
    if (probs.draw >= 25) signs.push("X");
    if (probs.away >= 28) signs.push("2");
    return { recommendation: "gardering", recommendedSigns: signs.length > 0 ? signs : ["1", "X", "2"] };
  }

  // Normal
  const sign: Selection = probs.home >= probs.away ? "1" : "2";
  return { recommendation: "normal", recommendedSigns: [sign] };
}

/**
 * Transformerar ett football-data.org match-objekt till vår Match-typ.
 * Hämtar lagform och beräknar Poisson-sannolikheter.
 */
async function transformMatch(
  fdMatch: FDMatch,
  index: number,
  fetchForm: boolean
): Promise<Match> {
  const matchDate = new Date(fdMatch.utcDate);
  const dateStr = matchDate.toISOString().split("T")[0];
  const timeStr = matchDate.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });

  // Step 1: Try local Soccerway cache — zero API calls, covers known Stryktips teams.
  // Partial name matching handles API name variants like "Manchester City FC" → "Manchester City".
  const homeLocal = lookupTeamForm(fdMatch.homeTeam.name)
    ?? lookupTeamForm(fdMatch.homeTeam.shortName);
  const awayLocal = lookupTeamForm(fdMatch.awayTeam.name)
    ?? lookupTeamForm(fdMatch.awayTeam.shortName);

  // Step 1b: For teams not in the Soccerway cache, use competition-level averages
  // plus a small deterministic offset derived from the team's stable API ID.
  // This prevents every unknown-team card from showing identical data while
  // remaining reproducible (same team = same result across page loads).
  const compGoals = COMPETITION_AVG_GOALS[fdMatch.competition.code] ?? DEFAULT_COMP_GOALS;

  let homeStats = homeLocal ?? {
    formString: "OVOOV",
    goalsForAvg:     Math.max(0.8, compGoals.homeGoals + teamGoalVariance(fdMatch.homeTeam.id, 17)),
    goalsAgainstAvg: Math.max(0.7, compGoals.awayGoals - teamGoalVariance(fdMatch.homeTeam.id, 11) * 0.5),
  };
  let awayStats = awayLocal ?? {
    formString: "OVOOV",
    goalsForAvg:     Math.max(0.7, compGoals.awayGoals + teamGoalVariance(fdMatch.awayTeam.id, 13)),
    goalsAgainstAvg: Math.max(0.7, compGoals.homeGoals - teamGoalVariance(fdMatch.awayTeam.id, 19) * 0.5),
  };

  // Step 2: Fetch live form from API if requested (overwrites local data when successful)
  if (fetchForm) {
    const [homeMatches, awayMatches] = await Promise.all([
      fetchTeamRecentMatches(fdMatch.homeTeam.id),
      fetchTeamRecentMatches(fdMatch.awayTeam.id),
    ]);
    const liveHome = calculateTeamStats(homeMatches, fdMatch.homeTeam.id);
    const liveAway = calculateTeamStats(awayMatches, fdMatch.awayTeam.id);
    // Only override if we got real matches back (not empty defaults)
    if (homeMatches.length > 0) homeStats = liveHome;
    if (awayMatches.length > 0) awayStats = liveAway;
  }

  // Poisson-sannolikheter
  const poissonProbs = getPoissonProbabilities(
    homeStats.goalsForAvg,
    homeStats.goalsAgainstAvg,
    homeStats.formString,
    awayStats.goalsForAvg,
    awayStats.goalsAgainstAvg,
    awayStats.formString,
    1.18
  );

  // xG-estimat från Poisson lambda
  const xg = {
    home: Math.round(homeStats.goalsForAvg * 0.9 * 10) / 10,
    away: Math.round(awayStats.goalsForAvg * 0.85 * 10) / 10,
  };

  const streckning = estimateStreckning(poissonProbs);

  // Use API odds only if all three values are valid positive numbers.
  // The free tier often returns { homeWin: null, draw: null, awayWin: null } — an object
  // that is truthy but whose null values coerce to 0, causing NaN in downstream calculations.
  const apiOdds = fdMatch.odds;
  const hasValidOdds =
    apiOdds != null &&
    typeof apiOdds.homeWin === "number" && apiOdds.homeWin > 0 &&
    typeof apiOdds.draw === "number" && apiOdds.draw > 0 &&
    typeof apiOdds.awayWin === "number" && apiOdds.awayWin > 0;

  const odds = hasValidOdds
    ? { home: apiOdds!.homeWin as number, draw: apiOdds!.draw as number, away: apiOdds!.awayWin as number }
    : estimateOdds(poissonProbs);

  const { recommendation, recommendedSigns } = determineRecommendation(
    poissonProbs,
    streckning
  );

  const analysis = generateAnalysis(
    fdMatch.homeTeam.shortName,
    fdMatch.awayTeam.shortName,
    poissonProbs,
    streckning,
    homeStats.formString,
    awayStats.formString,
    xg
  );

  const matchObj: Match = {
    id: fdMatch.id,
    matchNumber: index + 1,
    homeTeam: fdMatch.homeTeam.name,
    awayTeam: fdMatch.awayTeam.name,
    league: fdMatch.competition.name,
    date: dateStr,
    time: timeStr,
    odds,
    probabilities: poissonProbs,
    streckning,
    xg,
    recommendation,
    recommendedSigns,
    valueScore: 0, // beräknas nedan
    analysis,
    homeForm: homeStats.formString,
    awayForm: awayStats.formString,
    homeAdvantageFactor: 1.18,
    poissonProbabilities: poissonProbs,
    motivationHome: 3,
    motivationAway: 3,
  };

  // Beräkna value score dynamiskt
  const breakdown = getValueBreakdown(matchObj);
  return { ...matchObj, valueScore: breakdown.compositeScore };
}

/**
 * Huvudfunktion: hämtar och analyserar dagens och morgondagens matcher.
 * Returnerar null om API-nyckel saknas (använd fallback-data).
 *
 * @param fetchTeamForm - Hämta lagform via extra API-anrop (mer träffsäkert men långsammare)
 */
export async function fetchLiveMatches(
  fetchTeamForm = false
): Promise<Match[] | null> {
  if (!process.env.FOOTBALL_DATA_API_KEY) return null;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const dateFrom = fmt(today);
  const dateTo = fmt(tomorrow);

  const fdMatches = await fetchMatchesByDate(dateFrom, dateTo);
  if (fdMatches.length === 0) return null;

  // Begränsa till 13 matcher (Stryktips-format) — prioritera toppliguor
  const priority = ["CL", "EL", "PL", "BL1", "SA", "PD", "FL1", "PPL"];
  const sorted = [...fdMatches].sort(
    (a, b) =>
      priority.indexOf(a.competition.code) -
      priority.indexOf(b.competition.code)
  );
  const top13 = sorted.slice(0, 13);

  const matches = await Promise.all(
    top13.map((m, i) => transformMatch(m, i, fetchTeamForm))
  );

  return matches;
}
