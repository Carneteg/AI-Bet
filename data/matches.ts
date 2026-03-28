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
}

export const matches: Match[] = [
  {
    id: 1, matchNumber: 1,
    homeTeam: "Manchester City", awayTeam: "Arsenal",
    league: "Premier League", date: "2025-04-05", time: "16:00",
    odds: { home: 1.85, draw: 3.5, away: 4.2 },
    probabilities: { home: 58, draw: 24, away: 18 },
    recommendation: "spik", recommendedSigns: ["1"], valueScore: 87,
    analysis: "City dominerar hemma med 82% vinstprocent denna säsong. Arsenal saknar Saka och Martinelli. Klart hemmalag.",
    homeForm: "V V V O V", awayForm: "V F V V O",
  },
  {
    id: 2, matchNumber: 2,
    homeTeam: "Bayer Leverkusen", awayTeam: "Bayern München",
    league: "Bundesliga", date: "2025-04-05", time: "18:30",
    odds: { home: 2.9, draw: 3.4, away: 2.45 },
    probabilities: { home: 35, draw: 28, away: 37 },
    recommendation: "gardering", recommendedSigns: ["1", "X", "2"], valueScore: 62,
    analysis: "Toppuppgörelse med jämna odds. Leverkusen har tappat formen senaste veckorna. Gardera alla tecken.",
    homeForm: "V O F V V", awayForm: "V V V F V",
  },
  {
    id: 3, matchNumber: 3,
    homeTeam: "Malmö FF", awayTeam: "IFK Göteborg",
    league: "Allsvenskan", date: "2025-04-05", time: "15:00",
    odds: { home: 1.7, draw: 3.6, away: 5.5 },
    probabilities: { home: 62, draw: 22, away: 16 },
    recommendation: "spik", recommendedSigns: ["1"], valueScore: 91,
    analysis: "Malmö är starka hemma på Eleda. Göteborg i bottenform med fyra raka förluster. Säker spik.",
    homeForm: "V V V V O", awayForm: "F F F O F",
  },
  {
    id: 4, matchNumber: 4,
    homeTeam: "Real Madrid", awayTeam: "Atletico Madrid",
    league: "La Liga", date: "2025-04-06", time: "21:00",
    odds: { home: 2.1, draw: 3.2, away: 3.6 },
    probabilities: { home: 48, draw: 27, away: 25 },
    recommendation: "gardering", recommendedSigns: ["1", "X"], valueScore: 70,
    analysis: "Derbin är alltid svårspelad. Atletico är solida defensivt. Gardera 1 och X för trygghet.",
    homeForm: "V V F V V", awayForm: "O V V O V",
  },
  {
    id: 5, matchNumber: 5,
    homeTeam: "Nottingham Forest", awayTeam: "Liverpool",
    league: "Premier League", date: "2025-04-06", time: "14:00",
    odds: { home: 5.2, draw: 4.0, away: 1.6 },
    probabilities: { home: 15, draw: 22, away: 63 },
    recommendation: "skräll", recommendedSigns: ["1", "X"], valueScore: 74,
    analysis: "Forest vinner 40% av sina hemmamatcher mot topptream denna säsong. Liverpool utan Salah. Skrällchans.",
    homeForm: "O V F V O", awayForm: "V V V O V",
  },
  {
    id: 6, matchNumber: 6,
    homeTeam: "Paris Saint-Germain", awayTeam: "Olympique Marseille",
    league: "Ligue 1", date: "2025-04-06", time: "20:45",
    odds: { home: 1.55, draw: 4.1, away: 5.8 },
    probabilities: { home: 68, draw: 20, away: 12 },
    recommendation: "spik", recommendedSigns: ["1"], valueScore: 88,
    analysis: "PSG dominerar Le Classique. Marseille i kris med tre raka förluster i ligan. Säker spik.",
    homeForm: "V V V V V", awayForm: "F O F F V",
  },
  {
    id: 7, matchNumber: 7,
    homeTeam: "Napoli", awayTeam: "Inter Milan",
    league: "Serie A", date: "2025-04-07", time: "20:45",
    odds: { home: 2.8, draw: 3.3, away: 2.5 },
    probabilities: { home: 36, draw: 29, away: 35 },
    recommendation: "gardering", recommendedSigns: ["X", "2"], valueScore: 65,
    analysis: "Inter är starka borta. Napoli instabila defensivt. Gardera X och 2 för bra täckning.",
    homeForm: "V F O V F", awayForm: "V V O V V",
  },
  {
    id: 8, matchNumber: 8,
    homeTeam: "Borussia Dortmund", awayTeam: "RB Leipzig",
    league: "Bundesliga", date: "2025-04-07", time: "18:30",
    odds: { home: 2.3, draw: 3.4, away: 3.1 },
    probabilities: { home: 44, draw: 28, away: 28 },
    recommendation: "skräll", recommendedSigns: ["2"], valueScore: 71,
    analysis: "Leipzig understreckade kraftigt. Dortmunds hemmaform är svag. Värde i Leipzig-seger.",
    homeForm: "F V O F V", awayForm: "V V V F V",
  },
  {
    id: 9, matchNumber: 9,
    homeTeam: "Celtic", awayTeam: "Rangers",
    league: "Scottish Premiership", date: "2025-04-07", time: "13:30",
    odds: { home: 1.9, draw: 3.5, away: 3.9 },
    probabilities: { home: 55, draw: 25, away: 20 },
    recommendation: "gardering", recommendedSigns: ["1", "X"], valueScore: 68,
    analysis: "Old Firm alltid oförutsägbart. Celtic starka hemma men derbyn lever sitt eget liv.",
    homeForm: "V V O V V", awayForm: "V F V V O",
  },
  {
    id: 10, matchNumber: 10,
    homeTeam: "AIK", awayTeam: "Djurgårdens IF",
    league: "Allsvenskan", date: "2025-04-07", time: "17:30",
    odds: { home: 2.5, draw: 3.2, away: 2.8 },
    probabilities: { home: 40, draw: 30, away: 30 },
    recommendation: "normal", recommendedSigns: ["1", "X"], valueScore: 58,
    analysis: "Stockholmsderby med jämna chanser. AIK har marginalfördel hemma på Friends Arena.",
    homeForm: "O V F V O", awayForm: "V O V F V",
  },
  {
    id: 11, matchNumber: 11,
    homeTeam: "Porto", awayTeam: "Benfica",
    league: "Primeira Liga", date: "2025-04-08", time: "21:15",
    odds: { home: 2.6, draw: 3.3, away: 2.7 },
    probabilities: { home: 38, draw: 28, away: 34 },
    recommendation: "gardering", recommendedSigns: ["1", "2"], valueScore: 66,
    analysis: "O Clássico alltid jämnt. Gardera Porto och Benfica, hoppa över X.",
    homeForm: "V V F O V", awayForm: "V V V O F",
  },
  {
    id: 12, matchNumber: 12,
    homeTeam: "Tottenham Hotspur", awayTeam: "Chelsea",
    league: "Premier League", date: "2025-04-08", time: "20:00",
    odds: { home: 3.1, draw: 3.4, away: 2.3 },
    probabilities: { home: 30, draw: 28, away: 42 },
    recommendation: "normal", recommendedSigns: ["2"], valueScore: 60,
    analysis: "Chelsea i bra form. Tottenham instabila. Viss fördel för Chelsea men inga klara odds.",
    homeForm: "F F V O F", awayForm: "V V O V V",
  },
  {
    id: 13, matchNumber: 13,
    homeTeam: "Hammarby", awayTeam: "Häcken",
    league: "Allsvenskan", date: "2025-04-08", time: "19:00",
    odds: { home: 2.2, draw: 3.4, away: 3.2 },
    probabilities: { home: 46, draw: 28, away: 26 },
    recommendation: "normal", recommendedSigns: ["1", "X"], valueScore: 55,
    analysis: "Hammarby starka hemma på Tele2. Häcken bra offensiv men sårbar defensivt.",
    homeForm: "V O V V F", awayForm: "V V F O V",
  },
];
