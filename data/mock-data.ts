import { SportEvent } from "../lib/types";

export const mockEvents: SportEvent[] = [
  {
    id: "evt_1",
    name: "Real Sociedad vs. Valencia",
    sport: "Football",
    leagueOrVenue: "La Liga",
    startTime: "Today, 20:00",
    odds: {
      market: "1X2 (Match Winner)",
      selection: "Real Sociedad",
      openingOdds: 1.85,
      currentOdds: 2.35,
    },
    context: {
      injuries: ["Top goalscorer", "Starting Center-Back"],
      underlyingMetrics: "System-heavy team, xG unaffected by rotation",
      publicBias: "Heavy drift against home team due to injury news",
    },
  },
  {
    id: "evt_2",
    name: "14:30 Group 3 Sprint",
    sport: "Horse Racing",
    leagueOrVenue: "Ascot",
    startTime: "Today, 14:30",
    odds: {
      market: "Win Market",
      selection: "Silent Runner",
      openingOdds: 5.5,
      currentOdds: 9.0,
    },
    context: {
      weatherOrCondition: "Heavy ground (unproven for favorite)",
      underlyingMetrics: "Highest speed figures in field on heavy ground",
      publicBias: "Massive yard/jockey tax on the favorite (Lightning Strike crushed to 1.70)",
    },
  },
  {
    id: "evt_3",
    name: "AC Milan vs. Inter Milan",
    sport: "Football",
    leagueOrVenue: "Serie A",
    startTime: "Today, 20:45",
    odds: {
      market: "Total Goals (Over/Under 2.5)",
      selection: "Under 2.5",
      openingOdds: 2.05,
      currentOdds: 2.45,
    },
    context: {
      publicBias: "Recreational money heavily backing Over due to recent high scores",
      underlyingMetrics: "Both managers pragmatic in huge derbies, high foul counts expected",
    },
  },
  {
    id: "evt_4",
    name: "Arsenal vs. Everton",
    sport: "Football",
    leagueOrVenue: "Premier League",
    startTime: "Today, 17:30",
    odds: {
      market: "Asian Handicap (+1.5)",
      selection: "Everton (+1.5)",
      openingOdds: 2.25,
      currentOdds: 1.9,
    },
    context: {
      motivationMismatch: true,
      publicBias: "Public heavily parlaying Arsenal 1X2",
      underlyingMetrics: "Everton low-block designed to frustrate possession teams",
    },
  },
  {
    id: "evt_5",
    name: "Borussia Dortmund vs. Eintracht Frankfurt",
    sport: "Football",
    leagueOrVenue: "Bundesliga",
    startTime: "Today, 15:30",
    odds: {
      market: "Total Goals (Over/Under 3.5)",
      selection: "Over 3.5",
      openingOdds: 2.25,
      currentOdds: 2.7,
    },
    context: {
      underlyingMetrics: "Dortmund xG over 2.2 in recent 0-0 draws. Extreme negative finishing variance.",
      publicBias: "Algorithm/market downgrading goal lines based purely on recent 0-0 results",
    },
  },
];
