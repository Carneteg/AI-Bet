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
  recommendation: Recommendation;
  recommendedSigns: Selection[];
  valueScore: number;
  analysis: string;
  homeForm: string;
  awayForm: string;
  homeAdvantageFactor: number;
}

const rawMatches: Match[] = [
  {
    id: 1, matchNumber: 1,
    homeTeam: "Manchester City", awayTeam: "Arsenal",
    league: "Premier League", date: "2025-04-05", time: "16:00",
    odds: { home: 1.85, draw: 3.5, away: 4.2 },
    probabilities: { home: 58, draw: 24, away: 18 },
    recommendation: "spik", recommendedSigns: ["1"], valueScore: 87,
    analysis: "City dominerar hemma. Arsenal utan Saka. Klart hemmalag.",
    homeForm: "VVVOV", awayForm: "VFVVO", homeAdvantageFactor: 1.2,
  },
  {
    id: 2, matchNumber: 2,
    homeTeam: "Bayer Leverkusen", awayTeam: "Bayern München",
    league: "Bundesliga", date: "2025-04-05", time: "18:30",
    odds: { home: 2.9, draw: 3.4, away: 2.45 },
    probabilities: { home: 35, draw: 28, away: 37 },
    recommendation: "gardering", recommendedSigns: ["1","X","2"], valueScore: 62,
    analysis: "Toppuppgörelse. Leverkusen tappat formen. Gardera alla tecken.",
    homeForm: "VOVFV", awayForm: "VVVFV", homeAdvantageFactor: 1.15,
  },
  {
    id: 3, matchNumber: 3,
    homeTeam: "Malmö FF", awayTeam: "IFK Göteborg",
    league: "Allsvenskan", date: "2025-04-05", time: "15:00",
    odds: { home: 1.7, draw: 3.6, away: 5.5 },
    probabilities: { home: 62, draw: 22, away: 16 },
    recommendation: "spik", recommendedSigns: ["1"], valueScore: 91,
    analysis: "Malmö starka hemma. Göteborg i bottenform. Säker spik.",
    homeForm: "VVVVO", awayForm: "FFFOV", homeAdvantageFactor: 1.25,
  },
  {
    id: 4, matchNumber: 4,
    homeTeam: "Real Madrid", awayTeam: "Atletico Madrid",
    league: "La Liga", date: "2025-04-06", time: "21:00",
    odds: { home: 2.1, draw: 3.2, away: 3.6 },
    probabilities: { home: 48, draw: 27, away: 25 },
    recommendation: "gardering", recommendedSigns: ["1","X"], valueScore: 70,
    analysis: "Derbin svårspelad. Atletico solida defensivt. Gardera 1 och X.",
    homeForm: "VVFVV", awayForm: "OVVOV", homeAdvantageFactor: 1.1,
  },
  {
    id: 5, matchNumber: 5,
    homeTeam: "Nottingham Forest", awayTeam: "Liverpool",
    league: "Premier League", date: "2025-04-06", time: "14:00",
    odds: { home: 5.2, draw: 4.0, away: 1.6 },
    probabilities: { home: 15, draw: 22, away: 63 },
    recommendation: "skräll", recommendedSigns: ["1","X"], valueScore: 74,
    analysis: "Forest vinner 40% hemma mot topptream. Liverpool utan Salah. Skrällchans.",
    homeForm: "OVFVO", awayForm: "VVVOV", homeAdvantageFactor: 1.05,
  },
  {
    id: 6, matchNumber: 6,
    homeTeam: "PSG", awayTeam: "Marseille",
    league: "Ligue 1", date: "2025-04-06", time: "20:45",
    odds: { home: 1.55, draw: 4.1, away: 5.8 },
    probabilities: { home: 68, draw: 20, away: 12 },
    recommendation: "spik", recommendedSigns: ["1"], valueScore: 88,
    analysis: "PSG dominerar Le Classique. Marseille i kris. Säker spik.",
    homeForm: "VVVVV", awayForm: "FOFFV", homeAdvantageFactor: 1.2,
  },
  {
    id: 7, matchNumber: 7,
    homeTeam: "Napoli", awayTeam: "Inter Milan",
    league: "Serie A", date: "2025-04-07", time: "20:45",
    odds: { home: 2.8, draw: 3.3, away: 2.5 },
    probabilities: { home: 36, draw: 29, away: 35 },
    recommendation: "gardering", recommendedSigns: ["X","2"], valueScore: 65,
    analysis: "Inter starka borta. Napoli instabila. Gardera X och 2.",
    homeForm: "VFOVF", awayForm: "VVOVV", homeAdvantageFactor: 1.1,
  },
  {
    id: 8, matchNumber: 8,
    homeTeam: "Dortmund", awayTeam: "RB Leipzig",
    league: "Bundesliga", date: "2025-04-07", time: "18:30",
    odds: { home: 2.3, draw: 3.4, away: 3.1 },
    probabilities: { home: 44, draw: 28, away: 28 },
    recommendation: "skräll", recommendedSigns: ["2"], valueScore: 71,
    analysis: "Leipzig understreckade. Dortmund svag hemmaform. Värde i Leipzigvinst.",
    homeForm: "FVOFF", awayForm: "VVVOV", homeAdvantageFactor: 1.15,
  },
  {
    id: 9, matchNumber: 9,
    homeTeam: "Celtic", awayTeam: "Rangers",
    league: "Scottish Prem.", date: "2025-04-07", time: "13:30",
    odds: { home: 1.9, draw: 3.5, away: 3.9 },
    probabilities: { home: 55, draw: 25, away: 20 },
    recommendation: "gardering", recommendedSigns: ["1","X"], valueScore: 68,
    analysis: "Old Firm alltid oförutsägbart. Celtic starka men derbyn lever eget liv.",
    homeForm: "VVOVV", awayForm: "VFVVO", homeAdvantageFactor: 1.2,
  },
  {
    id: 10, matchNumber: 10,
    homeTeam: "AIK", awayTeam: "Djurgårdens IF",
    league: "Allsvenskan", date: "2025-04-07", time: "17:30",
    odds: { home: 2.5, draw: 3.2, away: 2.8 },
    probabilities: { home: 40, draw: 30, away: 30 },
    recommendation: "normal", recommendedSigns: ["1","X"], valueScore: 58,
    analysis: "Stockholmsderby med jämna chanser. AIK marginell fördel hemma.",
    homeForm: "OVFVO", awayForm: "VOVFV", homeAdvantageFactor: 1.1,
  },
  {
    id: 11, matchNumber: 11,
    homeTeam: "Porto", awayTeam: "Benfica",
    league: "Primeira Liga", date: "2025-04-08", time: "21:15",
    odds: { home: 2.6, draw: 3.3, away: 2.7 },
    probabilities: { home: 38, draw: 28, away: 34 },
    recommendation: "gardering", recommendedSigns: ["1","2"], valueScore: 66,
    analysis: "O Clássico alltid jämnt. Gardera Porto och Benfica.",
    homeForm: "VVFOV", awayForm: "VVVOF", homeAdvantageFactor: 1.15,
  },
  {
    id: 12, matchNumber: 12,
    homeTeam: "Tottenham", awayTeam: "Chelsea",
    league: "Premier League", date: "2025-04-08", time: "20:00",
    odds: { home: 3.1, draw: 3.4, away: 2.3 },
    probabilities: { home: 30, draw: 28, away: 42 },
    recommendation: "normal", recommendedSigns: ["2"], valueScore: 60,
    analysis: "Chelsea i bra form. Tottenham instabila med skador. Klart bortalag.",
    homeForm: "FFVOF", awayForm: "VVOVV", homeAdvantageFactor: 1.05,
  },
  {
    id: 13, matchNumber: 13,
    homeTeam: "Hammarby", awayTeam: "Häcken",
    league: "Allsvenskan", date: "2025-04-08", time: "19:00",
    odds: { home: 2.2, draw: 3.4, away: 3.2 },
    probabilities: { home: 46, draw: 28, away: 26 },
    recommendation: "normal", recommendedSigns: ["1","X"], valueScore: 55,
    analysis: "Hammarby starka hemma på Tele2. Häcken bra offensiv men sårbar defensivt.",
    homeForm: "VOVVF", awayForm: "VVFOV", homeAdvantageFactor: 1.15,
  },
];

// Enrich all matches with real form data from Soccerway datasource
export const matches: Match[] = rawMatches.map((m) =>
  enrichMatchWithSoccerwayData(m)
);
