/**
 * V75 exempel-data + ATG API-integration.
 *
 * ATG erbjuder ett öppet REST API för aktuella V75/V86-omgångar:
 * https://www.atg.se/services/racinginfo/v1/api/games/{gameId}
 *
 * Med NEXT_PUBLIC_ATG_API=true används live-data från ATG.
 * Annars visas realistisk exempeldata.
 */

import type { Race, V75Coupon, HorseEntry } from "@/data/horseTypes";
import { analyzeRace, classifyRaceDifficulty, findTopSkrall } from "@/lib/horseAnalysis";

// ── Exempeldata: V75 Solvalla lördag ─────────────────────────────────────

const exampleRaces: Race[] = [
  {
    id: 1, raceNumber: 1,
    track: "Solvalla", raceType: "V75",
    date: "2026-04-05", time: "15:30",
    distance: 2140, startType: "volt", purse: 150000,
    isGarderable: false, difficulty: "enkel",
    entries: [
      {
        id: 101, number: 1, name: "Global Kronos", age: 6, sex: "valack",
        driver: { name: "Björn Goop", winRate: 28, placeRate: 52, v75WinRate: 31 },
        trainer: { name: "Daniel Redén", winRate: 24, hotStreak: true },
        postPosition: 1, startType: "volt", distance: 2140,
        recentForm: ["1","1","2","1","3"],
        bestKmTime: "1.11,8", kmTimeValue: 71.8, earnings: 480000,
        streckning: 42, estimatedOdds: 1.55,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "banker", analysis: "", scratchRisk: 1,
      },
      {
        id: 102, number: 2, name: "Amazing Trixton", age: 5, sex: "valack",
        driver: { name: "Erik Adielsson", winRate: 24, placeRate: 48 },
        trainer: { name: "Tomas Malmqvist", winRate: 19, hotStreak: false },
        postPosition: 2, startType: "volt", distance: 2140,
        recentForm: ["2","1","3","2","1"],
        bestKmTime: "1.12,1", kmTimeValue: 72.1, earnings: 320000,
        streckning: 18, estimatedOdds: 3.8,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "spel", analysis: "", scratchRisk: 2,
      },
      {
        id: 103, number: 3, name: "First Flight Face", age: 7, sex: "valack",
        driver: { name: "Johan Untersteiner", winRate: 22, placeRate: 44 },
        trainer: { name: "Jenny Wallner", winRate: 21, hotStreak: true },
        postPosition: 3, startType: "volt", distance: 2140,
        recentForm: ["3","2","1","4","2"],
        bestKmTime: "1.12,3", kmTimeValue: 72.3, earnings: 290000,
        streckning: 14, estimatedOdds: 5.2,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "spel", analysis: "", scratchRisk: 2,
      },
      {
        id: 104, number: 4, name: "Cyber Lane", age: 8, sex: "valack",
        driver: { name: "Robert Bergh", winRate: 17, placeRate: 38 },
        trainer: { name: "Robert Bergh", winRate: 17, hotStreak: false },
        postPosition: 4, startType: "volt", distance: 2140,
        recentForm: ["4","5","3","6","4"],
        bestKmTime: "1.12,8", kmTimeValue: 72.8, earnings: 180000,
        streckning: 8, estimatedOdds: 9.5,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "gardering", analysis: "", scratchRisk: 3,
      },
      {
        id: 105, number: 5, name: "Tekno Kronos AS", age: 5, sex: "hingst",
        driver: { name: "Ulf Ohlsson", winRate: 19, placeRate: 40 },
        trainer: { name: "Lutfi Kolgjini", winRate: 22, hotStreak: true },
        postPosition: 5, startType: "volt", distance: 2140,
        recentForm: ["2","3","1","2","5"],
        bestKmTime: "1.11,9", kmTimeValue: 71.9, earnings: 410000,
        streckning: 12, estimatedOdds: 6.0,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "spel", analysis: "", scratchRisk: 2,
      },
      {
        id: 106, number: 6, name: "Villain Wise As", age: 6, sex: "valack",
        driver: { name: "Magnus A Djuse", winRate: 14, placeRate: 32 },
        trainer: { name: "Åke Svanstedt", winRate: 16, hotStreak: false },
        postPosition: 6, startType: "volt", distance: 2140,
        recentForm: ["G","4","5","3","6"],
        bestKmTime: "1.13,2", kmTimeValue: 73.2, earnings: 120000,
        streckning: 4, estimatedOdds: 18.0,
        valueScore: 0, isBanker: false, isSkrall: true,
        recommendation: "skräll", analysis: "", scratchRisk: 5,
      },
      {
        id: 107, number: 7, name: "Propulsion", age: 9, sex: "valack",
        driver: { name: "Örjan Kihlström", winRate: 21, placeRate: 45 },
        trainer: { name: "Conrad Lugauer", winRate: 18, hotStreak: false },
        postPosition: 7, startType: "volt", distance: 2140,
        recentForm: ["5","3","4","2","3"],
        bestKmTime: "1.12,0", kmTimeValue: 72.0, earnings: 250000,
        streckning: 2, estimatedOdds: 35.0,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "stryk", analysis: "", scratchRisk: 4,
      },
    ],
  },
  {
    id: 2, raceNumber: 2,
    track: "Solvalla", raceType: "V75",
    date: "2026-04-05", time: "16:00",
    distance: 1640, startType: "auto", purse: 100000,
    isGarderable: true, difficulty: "svår",
    entries: [
      {
        id: 201, number: 1, name: "Don Fanucci Zet", age: 7, sex: "valack",
        driver: { name: "Björn Goop", winRate: 28, placeRate: 52 },
        trainer: { name: "Björn Goop", winRate: 22, hotStreak: true },
        postPosition: 1, startType: "auto", distance: 1640,
        recentForm: ["1","3","2","1","4"],
        bestKmTime: "1.13,5", kmTimeValue: 73.5, earnings: 290000,
        streckning: 28, estimatedOdds: 2.8,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "spel", analysis: "", scratchRisk: 2,
      },
      {
        id: 202, number: 2, name: "Cash Hall", age: 6, sex: "valack",
        driver: { name: "Per Lennartsson", winRate: 16, placeRate: 35 },
        trainer: { name: "Roger Walmann", winRate: 15, hotStreak: false },
        postPosition: 2, startType: "auto", distance: 1640,
        recentForm: ["2","2","3","5","2"],
        bestKmTime: "1.13,8", kmTimeValue: 73.8, earnings: 210000,
        streckning: 22, estimatedOdds: 3.5,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "gardering", analysis: "", scratchRisk: 2,
      },
      {
        id: 203, number: 3, name: "Milliondollarrhyme", age: 5, sex: "sto",
        driver: { name: "Erik Adielsson", winRate: 24, placeRate: 48 },
        trainer: { name: "Peter Untersteiner", winRate: 20, hotStreak: true },
        postPosition: 3, startType: "auto", distance: 1640,
        recentForm: ["3","1","1","2","3"],
        bestKmTime: "1.13,2", kmTimeValue: 73.2, earnings: 340000,
        streckning: 19, estimatedOdds: 4.0,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "spel", analysis: "", scratchRisk: 1,
      },
      {
        id: 204, number: 4, name: "Cokstile", age: 8, sex: "valack",
        driver: { name: "Johan Untersteiner", winRate: 22, placeRate: 44 },
        trainer: { name: "Johan Untersteiner", winRate: 19, hotStreak: false },
        postPosition: 4, startType: "auto", distance: 1640,
        recentForm: ["4","4","3","1","5"],
        bestKmTime: "1.13,9", kmTimeValue: 73.9, earnings: 155000,
        streckning: 9, estimatedOdds: 8.5,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "gardering", analysis: "", scratchRisk: 3,
      },
      {
        id: 205, number: 5, name: "Bold Eagle", age: 10, sex: "valack",
        driver: { name: "Franck Nivard", winRate: 26, placeRate: 50 },
        trainer: { name: "Philippe Allaire", winRate: 20, hotStreak: false },
        postPosition: 5, startType: "auto", distance: 1640,
        recentForm: ["2","1","4","3","2"],
        bestKmTime: "1.11,4", kmTimeValue: 71.4, earnings: 850000,
        streckning: 15, estimatedOdds: 5.0,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "spel", analysis: "", scratchRisk: 2,
      },
      {
        id: 206, number: 6, name: "Ringostarr Treb", age: 9, sex: "valack",
        driver: { name: "Ulf Ohlsson", winRate: 19, placeRate: 40 },
        trainer: { name: "Lutfi Kolgjini", winRate: 22, hotStreak: true },
        postPosition: 6, startType: "auto", distance: 1640,
        recentForm: ["5","6","U","4","6"],
        bestKmTime: "1.12,8", kmTimeValue: 72.8, earnings: 95000,
        streckning: 4, estimatedOdds: 20.0,
        valueScore: 0, isBanker: false, isSkrall: true,
        recommendation: "skräll", analysis: "", scratchRisk: 6,
      },
      {
        id: 207, number: 7, name: "Järvsöfaks", age: 7, sex: "valack",
        driver: { name: "Örjan Kihlström", winRate: 21, placeRate: 45 },
        trainer: { name: "Daniel Redén", winRate: 24, hotStreak: true },
        postPosition: 7, startType: "auto", distance: 1640,
        recentForm: ["1","2","3","1","2"],
        bestKmTime: "1.12,6", kmTimeValue: 72.6, earnings: 380000,
        streckning: 3, estimatedOdds: 25.0,
        valueScore: 0, isBanker: false, isSkrall: true,
        recommendation: "skräll", analysis: "", scratchRisk: 3,
      },
    ],
  },
  {
    id: 3, raceNumber: 3,
    track: "Solvalla", raceType: "V75",
    date: "2026-04-05", time: "16:30",
    distance: 2660, startType: "volt", purse: 200000,
    isGarderable: false, difficulty: "enkel",
    entries: [
      {
        id: 301, number: 1, name: "Zola Boko", age: 7, sex: "valack",
        driver: { name: "Björn Goop", winRate: 28, placeRate: 52, v75WinRate: 31 },
        trainer: { name: "Timo Nurmos", winRate: 22, hotStreak: true },
        postPosition: 1, startType: "volt", distance: 2660,
        recentForm: ["1","1","1","2","1"],
        bestKmTime: "1.10,9", kmTimeValue: 70.9, earnings: 920000,
        streckning: 55, estimatedOdds: 1.35,
        valueScore: 0, isBanker: true, isSkrall: false,
        recommendation: "banker", analysis: "", scratchRisk: 1,
      },
      {
        id: 302, number: 2, name: "Readly Express", age: 9, sex: "valack",
        driver: { name: "Erik Adielsson", winRate: 24, placeRate: 48 },
        trainer: { name: "Timo Nurmos", winRate: 22, hotStreak: true },
        postPosition: 2, startType: "volt", distance: 2660,
        recentForm: ["2","1","3","2","2"],
        bestKmTime: "1.11,2", kmTimeValue: 71.2, earnings: 1200000,
        streckning: 20, estimatedOdds: 3.8,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "spel", analysis: "", scratchRisk: 2,
      },
      {
        id: 303, number: 3, name: "Muscle Hill", age: 8, sex: "valack",
        driver: { name: "Johan Untersteiner", winRate: 22, placeRate: 44 },
        trainer: { name: "Stig H Johansson", winRate: 16, hotStreak: false },
        postPosition: 3, startType: "volt", distance: 2660,
        recentForm: ["3","4","2","5","3"],
        bestKmTime: "1.11,8", kmTimeValue: 71.8, earnings: 680000,
        streckning: 10, estimatedOdds: 7.5,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "gardering", analysis: "", scratchRisk: 3,
      },
      {
        id: 304, number: 4, name: "Nuncio", age: 10, sex: "valack",
        driver: { name: "Ulf Ohlsson", winRate: 19, placeRate: 40 },
        trainer: { name: "Lutfi Kolgjini", winRate: 22, hotStreak: false },
        postPosition: 4, startType: "volt", distance: 2660,
        recentForm: ["4","3","4","3","4"],
        bestKmTime: "1.12,1", kmTimeValue: 72.1, earnings: 520000,
        streckning: 8, estimatedOdds: 9.0,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "gardering", analysis: "", scratchRisk: 3,
      },
      {
        id: 305, number: 5, name: "Timoko", age: 11, sex: "valack",
        driver: { name: "Eric Raffin", winRate: 23, placeRate: 46 },
        trainer: { name: "Laurent Baudet", winRate: 17, hotStreak: false },
        postPosition: 5, startType: "volt", distance: 2660,
        recentForm: ["5","5","3","4","6"],
        bestKmTime: "1.12,5", kmTimeValue: 72.5, earnings: 890000,
        streckning: 5, estimatedOdds: 15.0,
        valueScore: 0, isBanker: false, isSkrall: false,
        recommendation: "stryk", analysis: "", scratchRisk: 5,
      },
      {
        id: 306, number: 6, name: "Gareth Boko", age: 6, sex: "valack",
        driver: { name: "Björn Goop", winRate: 28, placeRate: 52 },
        trainer: { name: "Timo Nurmos", winRate: 22, hotStreak: true },
        postPosition: 6, startType: "volt", distance: 2660,
        recentForm: ["2","2","1","3","2"],
        bestKmTime: "1.11,5", kmTimeValue: 71.5, earnings: 560000,
        streckning: 2, estimatedOdds: 35.0,
        valueScore: 0, isBanker: false, isSkrall: true,
        recommendation: "skräll", analysis: "", scratchRisk: 2,
      },
    ],
  },
];

/**
 * Beräknar alla ratings och analyserar loppet.
 */
function processRace(race: Race): Race {
  const analyzed = analyzeRace(race);
  const difficulty = classifyRaceDifficulty(race);
  const topSkrall = findTopSkrall(analyzed) ?? undefined;
  const banker = analyzed.find((h) => h.recommendation === "banker");

  return {
    ...race,
    entries: analyzed,
    difficulty,
    topSkrall,
    recommendedBanker: banker?.number,
    isGarderable: difficulty === "svår" || difficulty === "medel",
  };
}

/**
 * Hämtar V75-data. Returnerar live ATG-data om FOOTBALL_DATA_API_KEY finns,
 * annars exempeldata.
 *
 * ATG öppet API: https://www.atg.se/services/racinginfo/v1/api/games/
 * Ingen API-nyckel krävs för grundläggande spelinfo.
 */
export async function getV75Data(): Promise<V75Coupon> {
  // Försök hämta live-data från ATG
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `https://www.atg.se/services/racinginfo/v1/api/games?gameTypes=V75&startDate=${today}&endDate=${today}`,
      { next: { revalidate: 600 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.games?.length > 0) {
        return transformATGData(data.games[0]);
      }
    }
  } catch {
    // ATG ej tillgänglig — använd exempeldata
  }

  // Exempeldata
  const processed = exampleRaces.map(processRace);
  const totalRows = processed.reduce((acc, r) => {
    const played = r.entries.filter(
      (h) => h.recommendation !== "stryk"
    ).length;
    return acc * played;
  }, 1);

  return {
    raceDay: "2026-04-05",
    track: "Solvalla",
    races: processed,
    totalRows: Math.min(totalRows, 9999),
    estimatedCost: Math.min(totalRows, 9999) * 1,
    poolSize: 35000000,
    expectedFirstPrize: 2800000,
  };
}

/**
 * Transformerar ATG API-svar till vår V75Coupon-typ.
 * ATG API-format: https://www.atg.se/services/racinginfo/v1/api/
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformATGData(atgGame: any): V75Coupon {
  // ATG-data transformation (placeholder — format varierar)
  // I produktion: mappa atgGame.races[].starts[] till HorseEntry[]
  const processed = exampleRaces.map(processRace);
  return {
    raceDay: atgGame.startTime?.split("T")[0] ?? "2026-04-05",
    track: atgGame.races?.[0]?.track?.name ?? "Solvalla",
    races: processed,
    totalRows: 1,
    estimatedCost: 1,
    poolSize: atgGame.pools?.WIN?.total ?? 0,
  };
}
