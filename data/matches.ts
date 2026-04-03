import { enrichMatchWithSoccerwayData } from "@/lib/datasources/soccerway";

export type Selection = "1" | "X" | "2";
export type Recommendation = "spik" | "gardering" | "skräll" | "normal";

export interface Match {
  id: number;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  odds: { home: number; draw: number; away: number };
  probabilities: { home: number; draw: number; away: number };
  /**
   * Streckningsprocent — hur stor andel av kuponginlämningarna som
   * valt respektive tecken. KRITISK för Stryktips-analys.
   * Låg streckningsprocent på ett utfall du bedömer troligt = högt value.
   */
  streckning: { home: number; draw: number; away: number };
  /**
   * xG (expected goals) från sista matchen eller säsongssnitt.
   * Mer prediktivt än faktiska mål på kort sikt.
   */
  xg: { home: number; away: number };
  recommendation: Recommendation;
  recommendedSigns: Selection[];
  valueScore: number;
  analysis: string;
  homeForm: string;
  awayForm: string;
  homeAdvantageFactor: number;
  /**
   * Poisson-härledda sannolikheter (beräknas vid berikning).
   * Används för att kalibrera manuellt satta probabilities.
   */
  poissonProbabilities?: { home: number; draw: number; away: number };
  /**
   * Motivationsindex 1-5:
   * 5 = Avgörande match (nedrflytt, mästerskapsjakt)
   * 1 = Ingenting att spela för
   */
  motivationHome: number;
  motivationAway: number;
}

const rawMatches: Match[] = [
  {
    id: 1, matchNumber: 1,
    homeTeam: "Manchester City", awayTeam: "Arsenal",
    league: "Premier League", date: "2026-04-03", time: "16:00",
    odds: { home: 1.85, draw: 3.5, away: 4.2 },
    probabilities: { home: 55, draw: 24, away: 21 },
    streckning: { home: 62, draw: 22, away: 16 },
    xg: { home: 1.82, away: 1.31 },
    recommendation: "spik", recommendedSigns: ["1"], valueScore: 0,
    analysis: "City dominerar hemma. Arsenal utan Saka. Klart hemmalag — men streckningen ÖVERVÄRDERAR City (62% vs 55% sannolikhet). Marginellt odds-värde. Streckning-edge pekar mot Arsenal/oavgjort.",
    homeForm: "VVVOV", awayForm: "VFVVO", homeAdvantageFactor: 1.2,
    motivationHome: 5, motivationAway: 5,
  },
  {
    id: 2, matchNumber: 2,
    homeTeam: "Bayer Leverkusen", awayTeam: "Bayern München",
    league: "Bundesliga", date: "2026-04-03", time: "18:30",
    odds: { home: 2.9, draw: 3.4, away: 2.45 },
    probabilities: { home: 33, draw: 27, away: 40 },
    streckning: { home: 28, draw: 30, away: 42 },
    xg: { home: 1.45, away: 1.68 },
    recommendation: "gardering", recommendedSigns: ["1","X","2"], valueScore: 0,
    analysis: "Bayern är ett av Europas bästa bortalag just nu. Leverkusen tappat formen senaste 3 matcherna (1V 2F). Streckningsprocenten är relativt balanserad — fullgardering motiverad. Bayerns xG senaste säsongen klart bättre.",
    homeForm: "VOVFV", awayForm: "VVVFV", homeAdvantageFactor: 1.15,
    motivationHome: 4, motivationAway: 5,
  },
  {
    id: 3, matchNumber: 3,
    homeTeam: "Malmö FF", awayTeam: "IFK Göteborg",
    league: "Allsvenskan", date: "2026-04-03", time: "15:00",
    odds: { home: 1.7, draw: 3.6, away: 5.5 },
    probabilities: { home: 64, draw: 21, away: 15 },
    streckning: { home: 71, draw: 18, away: 11 },
    xg: { home: 2.10, away: 0.78 },
    recommendation: "spik", recommendedSigns: ["1"], valueScore: 0,
    analysis: "Malmö bäst i Allsvenskan hemma — 5V 0F senaste 5 hemma. Göteborg utan 3 nyckelspelare p.g.a. skador. xG 2.10 mot 0.78 säger allt. VARNING: hög streckningsprocent (71%) ger låg utdelning om rätt.",
    homeForm: "VVVVO", awayForm: "FFFOV", homeAdvantageFactor: 1.25,
    motivationHome: 3, motivationAway: 4,
  },
  {
    id: 4, matchNumber: 4,
    homeTeam: "Real Madrid", awayTeam: "Atletico Madrid",
    league: "La Liga", date: "2026-04-03", time: "21:00",
    odds: { home: 2.1, draw: 3.2, away: 3.6 },
    probabilities: { home: 46, draw: 28, away: 26 },
    streckning: { home: 53, draw: 25, away: 22 },
    xg: { home: 1.73, away: 1.22 },
    recommendation: "gardering", recommendedSigns: ["1","X"], valueScore: 0,
    analysis: "Derbin statistiskt har Real 51% vinstfrekvens hemma. Atletico spelar ofta 0-0 eller 1-0 defensivt — hög oavgjort-sannolikhet (se xG 1.73 vs 1.22). Streckningen ÖVERSTRECKAR Real — ta 1+X.",
    homeForm: "VVFVV", awayForm: "OVVOV", homeAdvantageFactor: 1.1,
    motivationHome: 5, motivationAway: 5,
  },
  {
    id: 5, matchNumber: 5,
    homeTeam: "Nottingham Forest", awayTeam: "Liverpool",
    league: "Premier League", date: "2026-04-03", time: "14:00",
    odds: { home: 5.2, draw: 4.0, away: 1.6 },
    probabilities: { home: 18, draw: 23, away: 59 },
    streckning: { home: 9, draw: 18, away: 73 },
    xg: { home: 0.98, away: 1.87 },
    recommendation: "skräll", recommendedSigns: ["1","X"], valueScore: 0,
    analysis: "STARK SKRÄLL-KANDIDAT: Forest streckat till bara 9% men sannolikheten är 18%. xG hemma säsongen: 1.12 (underpresterat). Liverpool tappar fokus i bortamatcher utanför CL-veckor. Streckning-edge på Forest = +9pp.",
    homeForm: "OVFVO", awayForm: "VVVOV", homeAdvantageFactor: 1.05,
    motivationHome: 5, motivationAway: 3,
  },
  {
    id: 6, matchNumber: 6,
    homeTeam: "PSG", awayTeam: "Marseille",
    league: "Ligue 1", date: "2026-04-03", time: "20:45",
    odds: { home: 1.55, draw: 4.1, away: 5.8 },
    probabilities: { home: 67, draw: 20, away: 13 },
    streckning: { home: 74, draw: 17, away: 9 },
    xg: { home: 2.43, away: 0.89 },
    recommendation: "spik", recommendedSigns: ["1"], valueScore: 0,
    analysis: "PSG dominerar Le Classique hemma (7V 1O 0F senaste 8). Marseille i kris. xG är extremt dominerat av PSG. MEN: 74% streckad ger låg utdelning. Spik för radsäkring, ej för värdebetting.",
    homeForm: "VVVVV", awayForm: "FOFFV", homeAdvantageFactor: 1.2,
    motivationHome: 4, motivationAway: 5,
  },
  {
    id: 7, matchNumber: 7,
    homeTeam: "Napoli", awayTeam: "Inter Milan",
    league: "Serie A", date: "2026-04-04", time: "20:45",
    odds: { home: 2.8, draw: 3.3, away: 2.5 },
    probabilities: { home: 33, draw: 29, away: 38 },
    streckning: { home: 30, draw: 28, away: 42 },
    xg: { home: 1.38, away: 1.55 },
    recommendation: "gardering", recommendedSigns: ["X","2"], valueScore: 0,
    analysis: "Inter bästa bortalaget i Serie A. Napoli instabila defensivt (1.62 insläppta per match hemma). Streckning relativt korrekt. Marginellt odds-värde på oavgjort (29% sannolikt vs 3.3 i odds). Gardera X+2.",
    homeForm: "VFOVF", awayForm: "VVOVV", homeAdvantageFactor: 1.1,
    motivationHome: 4, motivationAway: 5,
  },
  {
    id: 8, matchNumber: 8,
    homeTeam: "Dortmund", awayTeam: "RB Leipzig",
    league: "Bundesliga", date: "2026-04-04", time: "18:30",
    odds: { home: 2.3, draw: 3.4, away: 3.1 },
    probabilities: { home: 41, draw: 27, away: 32 },
    streckning: { home: 48, draw: 24, away: 28 },
    xg: { home: 1.51, away: 1.33 },
    recommendation: "skräll", recommendedSigns: ["2"], valueScore: 0,
    analysis: "SKRÄLL: Leipzig UNDERSTRECKADE med 28% vs 32% sannolikhet. Dortmund 3F senaste 5. Leipzig vinner 45% av sina bortamatcher. Streckning-edge Leipzig +4pp. Odds 3.1 med 32% sannolikt = EV > 1.0.",
    homeForm: "FVOFF", awayForm: "VVVOV", homeAdvantageFactor: 1.15,
    motivationHome: 3, motivationAway: 4,
  },
  {
    id: 9, matchNumber: 9,
    homeTeam: "Celtic", awayTeam: "Rangers",
    league: "Scottish Prem.", date: "2026-04-04", time: "13:30",
    odds: { home: 1.9, draw: 3.5, away: 3.9 },
    probabilities: { home: 52, draw: 26, away: 22 },
    streckning: { home: 58, draw: 23, away: 19 },
    xg: { home: 1.62, away: 1.18 },
    recommendation: "gardering", recommendedSigns: ["1","X"], valueScore: 0,
    analysis: "Old Firm: Celtic starka hemma men derbyn är extremt volatile. Streckning överstreckar Celtic (58% vs 52% sannolikt). Historiskt 30% oavgjort i Old Firm. xG 1.62 vs 1.18 — Celtic favorit men inte solklar.",
    homeForm: "VVOVV", awayForm: "VFVVO", homeAdvantageFactor: 1.2,
    motivationHome: 5, motivationAway: 5,
  },
  {
    id: 10, matchNumber: 10,
    homeTeam: "AIK", awayTeam: "Djurgårdens IF",
    league: "Allsvenskan", date: "2026-04-04", time: "17:30",
    odds: { home: 2.5, draw: 3.2, away: 2.8 },
    probabilities: { home: 37, draw: 30, away: 33 },
    streckning: { home: 42, draw: 27, away: 31 },
    xg: { home: 1.28, away: 1.41 },
    recommendation: "skräll", recommendedSigns: ["X","2"], valueScore: 0,
    analysis: "SKRÄLL: AIK ÖVERSTRECKAT (42% vs 37% sannolikt). Djurgården vinner 55% av sina bortamatcher senaste säsongen. AIK tappat 3 raka hemma. xG pekar mot bortalaget. Streckning-edge Djurgården +2pp.",
    homeForm: "OVFVO", awayForm: "VOVFV", homeAdvantageFactor: 1.1,
    motivationHome: 4, motivationAway: 5,
  },
  {
    id: 11, matchNumber: 11,
    homeTeam: "Porto", awayTeam: "Benfica",
    league: "Primeira Liga", date: "2026-04-04", time: "21:15",
    odds: { home: 2.6, draw: 3.3, away: 2.7 },
    probabilities: { home: 39, draw: 27, away: 34 },
    streckning: { home: 36, draw: 29, away: 35 },
    xg: { home: 1.52, away: 1.48 },
    recommendation: "gardering", recommendedSigns: ["1","2"], valueScore: 0,
    analysis: "O Clássico: extremt jämnt (xG 1.52 vs 1.48). Streckning matchar sannolikheter väl — lågt totalt value. Marginellt odds-värde på hemma (39% vs implied 34%). Garderas 1+2, oavgjort undviks.",
    homeForm: "VVFOV", awayForm: "VVVOF", homeAdvantageFactor: 1.15,
    motivationHome: 5, motivationAway: 5,
  },
  {
    id: 12, matchNumber: 12,
    homeTeam: "Tottenham", awayTeam: "Chelsea",
    league: "Premier League", date: "2026-04-04", time: "20:00",
    odds: { home: 3.1, draw: 3.4, away: 2.3 },
    probabilities: { home: 27, draw: 27, away: 46 },
    streckning: { home: 22, draw: 25, away: 53 },
    xg: { home: 1.14, away: 1.71 },
    recommendation: "normal", recommendedSigns: ["2"], valueScore: 0,
    analysis: "Chelsea i stark form (5V senaste 5). Tottenham 4F senaste 5, 4 skadade. xG klart till Chelseas fördel. Chelsea UNDERSTRECKADE (53% vs 46% sannolikhet). Streckning-edge på Chelsea +7pp — bra singelbett.",
    homeForm: "FFVOF", awayForm: "VVOVV", homeAdvantageFactor: 1.05,
    motivationHome: 3, motivationAway: 4,
  },
  {
    id: 13, matchNumber: 13,
    homeTeam: "Hammarby", awayTeam: "Häcken",
    league: "Allsvenskan", date: "2026-04-04", time: "19:00",
    odds: { home: 2.2, draw: 3.4, away: 3.2 },
    probabilities: { home: 44, draw: 28, away: 28 },
    streckning: { home: 47, draw: 26, away: 27 },
    xg: { home: 1.67, away: 1.42 },
    recommendation: "normal", recommendedSigns: ["1","X"], valueScore: 0,
    analysis: "Hammarby starka hemma på Tele2 (xG 1.67). Häcken bra offensiv men sårbar defensivt. Streckning relativt korrekt — marginellt hemma-value. Lite edge på 1 (44% vs 47% streckat = -3pp, marginellt understreckad odds-sida).",
    homeForm: "VOVVF", awayForm: "VVFOV", homeAdvantageFactor: 1.15,
    motivationHome: 4, motivationAway: 4,
  },
];

// Enrich all matches with real form data from Soccerway datasource
// and recalculate value scores using the improved algorithm
import { calculateValueScore } from "@/lib/valueScore";

export const matches: Match[] = rawMatches
  .map((m) => enrichMatchWithSoccerwayData(m))
  .map((m) => ({ ...m, valueScore: calculateValueScore(m) }));
