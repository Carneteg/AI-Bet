export type Sport = "Football" | "Horse Racing" | "Basketball" | "Tennis";

export interface OddsData {
  market: string; // e.g., "1X2", "Over/Under 2.5", "Win"
  selection: string; // e.g., "Everton", "Under 2.5", "Lightning Strike"
  openingOdds: number; // decimal format, e.g., 6.50
  currentOdds: number; // decimal format, e.g., 4.80
}

export interface MarketContext {
  publicBias?: string; // e.g., "Heavy public backing on favorite"
  injuries?: string[]; // e.g., ["Star Striker out", "Starting CB out"]
  underlyingMetrics?: string; // e.g., "High xG despite 0-0 draws"
  motivationMismatch?: boolean; // e.g., true if one team fighting relegation, other safe
  weatherOrCondition?: string; // e.g., "Heavy ground" for horses
}

export interface SportEvent {
  id: string;
  name: string; // e.g., "Arsenal vs. Everton"
  sport: Sport;
  leagueOrVenue: string; // e.g., "Premier League" or "Ascot"
  startTime: string; // ISO String or display string
  odds: OddsData;
  context: MarketContext;
}

export interface Opportunity {
  eventId: string;
  event: SportEvent;
  inefficiencyScore: number; // 0-100 indicating how strong the value play is
  marketBelief: string; // generated text of what public thinks
  inefficiencyReasoning: string; // generated text of why market is wrong
  sharpBreakdown?: {
    trueProbStats: string;
    overvalued: string;
    undervalued: string;
    uncertainty: string;
  };
  quantBreakdown?: {
    outcomes: {
      selection: string;
      odds: number;
      impliedProb: number;
      modelProb: number;
      edge: number;
      ev: number;
      kellyPercentage: number;
      isRiskCapped: boolean;
    }[];
    conclusion: string;
  };
}

export interface PlacedBet {
  id: string;
  matchName: string;
  date: string;
  selection: string;
  oddsTaken: number;
  closingOdds: number;
  modelPropAtPlacement: number;
  result: "WIN" | "LOSS" | "VOID";
}

export interface PerformanceAnalysis {
  bet: PlacedBet;
  isPositiveEvAtPlacement: boolean;
  beatClosingLine: boolean;
  closingLineEdge: number;
  grade: "Good Bet" | "Bad Bet";
  rootCause: "Bad Model / Missed Info" | "Positive Variance / Bad Luck" | "Lucky Win" | "Solid Win" | "Void";
  keyLesson: string;
  adjustment: string;
}

export interface StrategistReport {
  metrics: {
    totalBets: number;
    hitRate: number; // percentage
    roi: number; // percentage
    avgEv: number; // percentage
    clvBeatRate: number; // percentage
  };
  actionable: {
    keepDoing: string;
    stopDoing: string;
    testNext: string;
  }
}

export interface SlateAngle {
  title: string;
  description: string;
  applicableMatches: string[];
}
