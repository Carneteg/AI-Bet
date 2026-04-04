import { PlacedBet } from "../lib/types";

export const mockHistory: PlacedBet[] = [
  {
    id: "bet_101",
    matchName: "Arsenal vs. Aston Villa",
    date: "2024-04-14",
    selection: "Aston Villa",
    oddsTaken: 4.80, // We got crazy good odds early
    closingOdds: 3.50, // Market steamed Villa hard right before kickoff
    modelPropAtPlacement: 28.0, // Model thought 28% win probability (true odds 3.57)
    result: "WIN" // Villa won
  },
  {
    id: "bet_102",
    matchName: "Man City vs. Real Madrid",
    date: "2024-04-17",
    selection: "Real Madrid",
    oddsTaken: 5.20,
    closingOdds: 4.60, // We beat the closing line
    modelPropAtPlacement: 22.0, // EV = (0.22 * 5.20) = 1.144 -> 14.4% edge
    result: "LOSS" // But Madrid actually lost this specific 90 min match
  },
  {
    id: "bet_103",
    matchName: "Chelsea vs. Everton",
    date: "2024-04-15",
    selection: "Everton",
    oddsTaken: 4.00,
    closingOdds: 5.50, // Market drifted heavily against us, likely injury news
    modelPropAtPlacement: 28.0, // Initial EV looked good
    result: "LOSS" // We got crushed 6-0
  },
  {
    id: "bet_104",
    matchName: "Bournemouth vs. Man Utd",
    date: "2024-04-13",
    selection: "Bournemouth",
    oddsTaken: 2.30,
    closingOdds: 2.60, // We lost CLV completely
    modelPropAtPlacement: 48.0, 
    result: "WIN" // But variance blessed us
  }
];
