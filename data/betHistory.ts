/**
 * Prestationsspårning och ROI-analys.
 *
 * En seriös bettare loggar ALLA spel — vinnare och förlorare.
 * ROI (Return on Investment) och CLV (Closing Line Value) är
 * de viktigaste nyckeltalen för att mäta om din metod verkligen ger edge.
 *
 * CLV-logik:
 * Om ditt spel hade odds 3.5 vid tidpunkten för spel men stängningsoddsen
 * var 3.1 — du bevisade edge mot marknaden. Det kallas positivt CLV.
 * Konsistent positivt CLV är det starkaste beviset på att du har en fungerande metod.
 */

export type BetOutcome = "win" | "loss" | "void" | "pending";
export type BetType = "stryktips" | "single" | "combo";

export interface BetRecord {
  id: string;
  date: string;
  matchId?: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sign: "1" | "X" | "2";
  yourOdds: number;          // Odds vid sättningstillfället
  closingOdds?: number;      // Stängningsoddsen (bästa CLV-mätning)
  stake: number;             // Insats i kr
  yourProbability: number;   // Din bedömda sannolikhet (0-100)
  streckningAtBet?: number;  // Streckningsprocent vid sättning
  outcome: BetOutcome;
  profit?: number;           // Nettovinst/förlust
  betType: BetType;
  notes?: string;
}

export interface PerformanceSummary {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;           // %
  totalStaked: number;
  totalProfit: number;
  roi: number;               // %
  avgOdds: number;
  avgCLV: number;            // Genomsnittlig Closing Line Value (%)
  bestStreak: number;
  currentStreak: number;
  byLeague: Record<string, { bets: number; roi: number }>;
  byRecommendation: Record<string, { bets: number; roi: number }>;
}

/**
 * Exempelhistorik — ersätt med riktig databas/API i produktion.
 * I en riktig implementation lagras detta i PostgreSQL eller liknande.
 */
export const betHistory: BetRecord[] = [
  {
    id: "bet-001",
    date: "2025-03-15",
    homeTeam: "Malmö FF", awayTeam: "AIK",
    league: "Allsvenskan",
    sign: "1",
    yourOdds: 1.85, closingOdds: 1.72,
    stake: 200,
    yourProbability: 58, streckningAtBet: 52,
    outcome: "win",
    profit: 170,
    betType: "single",
    notes: "Malmö hemma — streckning undersatts. CLV +7.5%",
  },
  {
    id: "bet-002",
    date: "2025-03-22",
    homeTeam: "Dortmund", awayTeam: "RB Leipzig",
    league: "Bundesliga",
    sign: "2",
    yourOdds: 3.20, closingOdds: 2.95,
    stake: 100,
    yourProbability: 35, streckningAtBet: 24,
    outcome: "win",
    profit: 220,
    betType: "single",
    notes: "Leipzig understreckad. Skräll som gick in. CLV +8.5%",
  },
  {
    id: "bet-003",
    date: "2025-03-29",
    homeTeam: "PSG", awayTeam: "Lyon",
    league: "Ligue 1",
    sign: "1",
    yourOdds: 1.45, closingOdds: 1.42,
    stake: 500,
    yourProbability: 72, streckningAtBet: 78,
    outcome: "win",
    profit: 225,
    betType: "single",
    notes: "Spik — hög sannolikhet trots låg utdelning.",
  },
  {
    id: "bet-004",
    date: "2025-04-01",
    homeTeam: "Tottenham", awayTeam: "Newcastle",
    league: "Premier League",
    sign: "2",
    yourOdds: 2.10, closingOdds: 2.05,
    stake: 150,
    yourProbability: 52, streckningAtBet: 44,
    outcome: "loss",
    profit: -150,
    betType: "single",
    notes: "Rätt tanke, fel resultat. Newcastle var starka men Spurs höll 1-0.",
  },
  {
    id: "bet-005",
    date: "2025-04-05",
    homeTeam: "Stryktips vecka 14", awayTeam: "",
    league: "Stryktips",
    sign: "1",
    yourOdds: 3.8, closingOdds: undefined,
    stake: 1024,
    yourProbability: 28, streckningAtBet: 31,
    outcome: "pending",
    profit: undefined,
    betType: "stryktips",
    notes: "32 rader — 3 spikar, 4 garderingar, 2 skrällar.",
  },
];

/**
 * Beräknar prestandasammanfattning från spellogg.
 */
export function calculatePerformance(
  history: BetRecord[]
): PerformanceSummary {
  const settled = history.filter(
    (b) => b.outcome === "win" || b.outcome === "loss"
  );
  const wins = settled.filter((b) => b.outcome === "win");
  const losses = settled.filter((b) => b.outcome === "loss");
  const pending = history.filter((b) => b.outcome === "pending");

  const totalStaked = settled.reduce((s, b) => s + b.stake, 0);
  const totalProfit = settled.reduce((s, b) => s + (b.profit ?? 0), 0);

  // CLV: (dina odds / stängningsoddsen - 1) × 100
  const clvValues = settled
    .filter((b) => b.closingOdds != null && b.closingOdds > 0)
    .map((b) => ((b.yourOdds / b.closingOdds!) - 1) * 100);
  const avgCLV =
    clvValues.length > 0
      ? clvValues.reduce((s, v) => s + v, 0) / clvValues.length
      : 0;

  // Serier
  let bestStreak = 0;
  let currentStreak = 0;
  let streak = 0;
  for (const b of settled) {
    if (b.outcome === "win") {
      streak++;
      if (streak > bestStreak) bestStreak = streak;
    } else {
      streak = 0;
    }
  }
  // Nuvarande
  for (let i = settled.length - 1; i >= 0; i--) {
    if (settled[i].outcome === "win") currentStreak++;
    else break;
  }

  // Per liga
  const byLeague: Record<string, { bets: number; profit: number; staked: number }> = {};
  for (const b of settled) {
    if (!byLeague[b.league]) byLeague[b.league] = { bets: 0, profit: 0, staked: 0 };
    byLeague[b.league].bets++;
    byLeague[b.league].profit += b.profit ?? 0;
    byLeague[b.league].staked += b.stake;
  }

  return {
    totalBets: history.length,
    wins: wins.length,
    losses: losses.length,
    pending: pending.length,
    winRate: settled.length > 0 ? Math.round((wins.length / settled.length) * 1000) / 10 : 0,
    totalStaked,
    totalProfit: Math.round(totalProfit),
    roi: totalStaked > 0 ? Math.round((totalProfit / totalStaked) * 1000) / 10 : 0,
    avgOdds: settled.length > 0
      ? Math.round((settled.reduce((s, b) => s + b.yourOdds, 0) / settled.length) * 100) / 100
      : 0,
    avgCLV: Math.round(avgCLV * 10) / 10,
    bestStreak,
    currentStreak,
    byLeague: Object.fromEntries(
      Object.entries(byLeague).map(([league, data]) => [
        league,
        {
          bets: data.bets,
          roi: data.staked > 0 ? Math.round((data.profit / data.staked) * 1000) / 10 : 0,
        },
      ])
    ),
    byRecommendation: {},
  };
}

/**
 * Beräknar Closing Line Value för ett enskilt bet.
 * Positivt CLV = du hade edge när du spelade.
 * Konsistent +CLV över 100+ bet = stark metod.
 */
export function calculateCLV(bet: BetRecord): number | null {
  if (!bet.closingOdds || bet.closingOdds <= 0) return null;
  return Math.round(((bet.yourOdds / bet.closingOdds) - 1) * 1000) / 10;
}
