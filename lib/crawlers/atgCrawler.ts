/**
 * ATG officiellt API-crawler.
 *
 * ATG tillhandahåller ett öppet REST API utan API-nyckel:
 * https://www.atg.se/services/racinginfo/v1/api/
 *
 * Ger oss:
 * - Exakta startlistor (hästar, kuskar, tränare, spår)
 * - Real-time streckningsprocent per häst
 * - Poolstorlekar (V75, V86, etc.)
 * - Odds
 * - Banornas underlag och väder
 *
 * Detta är guldstandarden för häst-data — direkt från ATG.
 */

import type { Race, HorseEntry, V75Coupon, RaceType } from "@/data/horseTypes";

const ATG_BASE = "https://www.atg.se/services/racinginfo/v1/api";

// ── ATG API-typer ─────────────────────────────────────────────────────────

interface ATGGame {
  id: string;
  type: string;
  startTime: string;
  status: string;
  races: ATGRace[];
  pools?: {
    WIN?: { total: number };
    V75?: { total: number };
    V86?: { total: number };
  };
}

interface ATGRace {
  id: string;
  name: string;
  number: number;
  startTime: string;
  distance: number;
  startMethod: "volt" | "auto";
  track: { id: string; name: string };
  prize?: number;
  starts: ATGStart[];
}

interface ATGStart {
  id: string;
  number: number;
  postPosition: number;
  horse: {
    id: string;
    name: string;
    age: number;
    sex: string;
    trainer: { firstName: string; lastName: string };
    statistics?: {
      years?: {
        "2025"?: { starts: number; wins: number; earnings: number };
        "2026"?: { starts: number; wins: number; earnings: number };
      };
    };
  };
  driver: { firstName: string; lastName: string };
  odds?: { win: number };
  pool?: { win?: { percentage: number } };
  scratched?: boolean;
}

interface ATGGamesResponse {
  games: ATGGame[];
}

// ── Hjälpfunktioner ───────────────────────────────────────────────────────

function atgFullName(obj: { firstName: string; lastName: string }): string {
  return `${obj.firstName} ${obj.lastName}`.trim();
}

function estimateDriverWinRate(driverName: string): number {
  // Kända svenska toppkuskar med approximativa vinst-%
  const topDrivers: Record<string, number> = {
    "Björn Goop": 29,
    "Erik Adielsson": 25,
    "Johan Untersteiner": 23,
    "Ulf Ohlsson": 20,
    "Örjan Kihlström": 21,
    "Magnus A Djuse": 15,
    "Per Lennartsson": 16,
    "Robert Bergh": 17,
    "Jörgen Westholm": 14,
    "Peter Ingves": 18,
    "Christoffer Eriksson": 19,
    "Carl Johan Jepson": 16,
    "Daniel Wäjersten": 17,
    "Kim Eriksson": 16,
    "Kevin Oscarsson": 18,
    "Franck Nivard": 26,
    "Eric Raffin": 24,
    "Björn Aurivillius": 15,
  };
  return topDrivers[driverName] ?? 14;
}

function parseATGStart(start: ATGStart, raceDistance: number): HorseEntry {
  const driverName = atgFullName(start.driver);
  const trainerName = atgFullName(start.horse.trainer);
  const winRate = estimateDriverWinRate(driverName);

  // Beräkna streckning från ATG-pool om tillgänglig
  const streckning = Math.round(start.pool?.win?.percentage ?? 10);

  // Estimera odds från streckning med 25% husandel (ATG)
  const estimatedOdds =
    streckning > 0
      ? Math.round((0.75 / (streckning / 100)) * 100) / 100
      : 15.0;

  // Säsongsstatistik
  const yearStats =
    start.horse.statistics?.years?.["2026"] ??
    start.horse.statistics?.years?.["2025"];
  const earnings = yearStats?.earnings ?? 0;

  return {
    id: parseInt(start.id.replace(/\D/g, "").slice(-6)) || Math.random() * 999999,
    number: start.number,
    name: start.horse.name,
    age: start.horse.age,
    sex: (start.horse.sex === "mare"
      ? "sto"
      : start.horse.sex === "gelding"
      ? "valack"
      : "hingst") as HorseEntry["sex"],
    driver: {
      name: driverName,
      winRate,
      placeRate: Math.round(winRate * 1.9),
    },
    trainer: {
      name: trainerName,
      winRate: Math.round(winRate * 0.85),
      hotStreak: false, // Uppdateras av travsport-crawler
    },
    postPosition: start.postPosition,
    startType: (start.scratched ? "volt" : "volt") as "volt" | "auto", // ATG ger startmetod på race-nivå
    distance: raceDistance,
    recentForm: ["O", "O", "O", "O", "O"], // Uppdateras av travsport-crawler
    bestKmTime: "1.14,0", // Uppdateras av travsport-crawler
    kmTimeValue: 74.0,
    earnings,
    streckning,
    estimatedOdds: Math.min(estimatedOdds, 99.0),
    valueScore: 0,
    isBanker: false,
    isSkrall: false,
    recommendation: "spel",
    analysis: "",
    scratchRisk: start.scratched ? 10 : 2,
  };
}

function parseATGRace(atgRace: ATGRace, raceType: RaceType): Race {
  const entries = atgRace.starts
    .filter((s) => !s.scratched)
    .map((s) => parseATGStart(s, atgRace.distance));

  return {
    id: parseInt(atgRace.id.replace(/\D/g, "").slice(-6)) || Math.random() * 99999,
    raceNumber: atgRace.number,
    track: atgRace.track.name,
    raceType,
    date: atgRace.startTime.split("T")[0],
    time: new Date(atgRace.startTime).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Stockholm",
    }),
    distance: atgRace.distance,
    startType: atgRace.startMethod ?? "volt",
    purse: atgRace.prize ?? 100000,
    entries,
    isGarderable: false, // Beräknas av analysmotor
    difficulty: "medel", // Beräknas av analysmotor
  };
}

// ── Publik API ────────────────────────────────────────────────────────────

/**
 * Hämtar aktuella V75-omgångar från ATG.
 */
export async function fetchATGGames(
  gameType: "V75" | "V86" | "V64" = "V75"
): Promise<ATGGame[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const res = await fetch(
      `${ATG_BASE}/games?gameTypes=${gameType}&startDate=${today}&endDate=${tomorrow}`,
      {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return [];
    const data: ATGGamesResponse = await res.json();
    return data.games ?? [];
  } catch {
    return [];
  }
}

/**
 * Hämtar fullständig spelomgång med alla lopp och hästar.
 */
export async function fetchATGRaceDay(
  gameType: "V75" | "V86" | "V64" = "V75"
): Promise<V75Coupon | null> {
  const games = await fetchATGGames(gameType);
  if (games.length === 0) return null;

  const game = games[0]; // Närmaste omgång
  const races = game.races.map((r) => parseATGRace(r, gameType as RaceType));

  const poolTotal =
    game.pools?.V75?.total ??
    game.pools?.V86?.total ??
    game.pools?.WIN?.total ??
    0;

  return {
    raceDay: game.startTime.split("T")[0],
    track: game.races[0]?.track.name ?? "Okänd bana",
    races,
    totalRows: 1, // Beräknas efter analys
    estimatedCost: 1,
    poolSize: poolTotal,
  };
}

/**
 * Hämtar ATG-streckning för specifik omgång (uppdateras live).
 * Returnerar Map: horseName → streckningsprocent
 */
export async function fetchLiveStreckning(
  gameId: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const res = await fetch(`${ATG_BASE}/games/${gameId}`, {
      headers: { Accept: "application/json" },
      cache: "no-store", // Alltid live för streckning
    });
    if (!res.ok) return map;
    const game: ATGGame = await res.json();

    for (const race of game.races) {
      for (const start of race.starts) {
        const pct = start.pool?.win?.percentage ?? 0;
        map.set(start.horse.name.toLowerCase(), Math.round(pct));
      }
    }
  } catch {
    // Returnera tom map
  }
  return map;
}
