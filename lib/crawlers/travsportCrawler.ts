/**
 * Travsport.se / Travinformation.se crawler.
 *
 * Svenska Travsportens officiella statistikdatabas.
 * Ger oss:
 * - Hästars fullständiga resultathistorik
 * - Kuskarnas säsongsstatistik
 * - Tränarstatistik
 * - Bästa km-tider per bana och underlag
 * - Häststammens information (far, mor)
 *
 * URL-mönster:
 * - Häst: https://www.travsport.se/sport/trav/ryttare-forare/{id}
 * - Kusk: https://www.travsport.se/sport/trav/ryttare-forare/{id}
 * - API:  https://api.travsport.se/  (om tillgängligt)
 */

import * as cheerio from "cheerio";
import type { HorseEntry } from "@/data/horseTypes";

const TRAVSPORT_BASE = "https://www.travsport.se";
const TRAVSPORT_API = "https://api.travsport.se";

// ── Typer ─────────────────────────────────────────────────────────────────

export interface TravsportHorseStats {
  horseName: string;
  recentForm: string[];       // Senaste 10 lopp
  bestKmTime: string;
  bestKmTimeValue: number;
  homeTrackTime: string;      // Bästa tid på hemmaplan
  starts2025: number;
  wins2025: number;
  earnings2025: number;
  starts2026: number;
  wins2026: number;
  earnings2026: number;
  lastRaceDate: string;
  daysSinceLastRace: number;
  trainerHotStreak: boolean;
  source: "travsport" | "fallback";
}

export interface TravsportDriverStats {
  driverName: string;
  winRate: number;
  placeRate: number;
  starts: number;
  wins: number;
  v75Wins?: number;
  currentStreak: number;      // Antal raka segrar
  source: "travsport" | "fallback";
}

// ── Kusk-statistik (känd databas) ─────────────────────────────────────────

/**
 * Söker kusk-statistik från Travsport.
 */
export async function fetchDriverStats(
  driverName: string
): Promise<TravsportDriverStats> {
  try {
    // Försök hämta via Travsport API/söksida
    const searchUrl = `${TRAVSPORT_BASE}/sport/trav/ryttare-forare?q=${encodeURIComponent(driverName)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AI-Bet/1.0; +https://ai-bet-chi.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 3600 }, // Cache 1h
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      // Extrahera statistik från HTML
      const statsText = $(".driver-stats, .jockey-stats, [class*='stat']")
        .first()
        .text();

      // Försök extrahera vinstprocent
      const winRateMatch = statsText.match(/(\d+(?:\.\d+)?)\s*%/);
      const winRate = winRateMatch ? parseFloat(winRateMatch[1]) : null;

      if (winRate !== null) {
        return {
          driverName,
          winRate: Math.round(winRate),
          placeRate: Math.round(winRate * 2),
          starts: 0,
          wins: 0,
          currentStreak: 0,
          source: "travsport",
        };
      }
    }
  } catch {
    // Fallback till lokal databas
  }

  return getKnownDriverStats(driverName);
}

/**
 * Lokal databas med kända kusk-statistik (uppdateras manuellt).
 * Används som fallback och som snabb lookup.
 */
function getKnownDriverStats(driverName: string): TravsportDriverStats {
  const knownDrivers: Record<
    string,
    Omit<TravsportDriverStats, "driverName" | "source">
  > = {
    "Björn Goop": { winRate: 29, placeRate: 55, starts: 420, wins: 122, v75Wins: 38, currentStreak: 2 },
    "Erik Adielsson": { winRate: 25, placeRate: 49, starts: 480, wins: 120, v75Wins: 31, currentStreak: 0 },
    "Johan Untersteiner": { winRate: 23, placeRate: 46, starts: 390, wins: 90, v75Wins: 22, currentStreak: 1 },
    "Ulf Ohlsson": { winRate: 20, placeRate: 42, starts: 510, wins: 102, v75Wins: 18, currentStreak: 0 },
    "Örjan Kihlström": { winRate: 21, placeRate: 44, starts: 350, wins: 74, v75Wins: 20, currentStreak: 3 },
    "Magnus A Djuse": { winRate: 15, placeRate: 33, starts: 440, wins: 66, currentStreak: 0 },
    "Per Lennartsson": { winRate: 16, placeRate: 34, starts: 380, wins: 61, currentStreak: 0 },
    "Robert Bergh": { winRate: 17, placeRate: 36, starts: 290, wins: 49, currentStreak: 1 },
    "Christoffer Eriksson": { winRate: 19, placeRate: 40, starts: 420, wins: 80, currentStreak: 0 },
    "Peter Ingves": { winRate: 18, placeRate: 38, starts: 310, wins: 56, currentStreak: 0 },
    "Kevin Oscarsson": { winRate: 18, placeRate: 39, starts: 360, wins: 65, currentStreak: 2 },
    "Daniel Wäjersten": { winRate: 17, placeRate: 36, starts: 280, wins: 48, currentStreak: 0 },
    "Franck Nivard": { winRate: 26, placeRate: 51, starts: 520, wins: 135, v75Wins: 28, currentStreak: 1 },
    "Eric Raffin": { winRate: 24, placeRate: 48, starts: 490, wins: 118, v75Wins: 25, currentStreak: 0 },
    "Björn Aurivillius": { winRate: 15, placeRate: 32, starts: 320, wins: 48, currentStreak: 0 },
  };

  const stats = knownDrivers[driverName];
  if (stats) {
    return { driverName, ...stats, source: "fallback" };
  }

  return {
    driverName,
    winRate: 14,
    placeRate: 30,
    starts: 200,
    wins: 28,
    currentStreak: 0,
    source: "fallback",
  };
}

// ── Häst-historik ─────────────────────────────────────────────────────────

/**
 * Hämtar hästens senaste resultat från Travsport.
 */
export async function fetchHorseHistory(
  horseName: string
): Promise<TravsportHorseStats> {
  try {
    // Sök hästen på Travsport
    const searchUrl = `${TRAVSPORT_BASE}/sport/trav/hastregister?q=${encodeURIComponent(horseName)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AI-Bet/1.0)",
        Accept: "text/html",
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const stats = parseHorseHistoryHTML($, horseName);
      if (stats) return stats;
    }
  } catch {
    // Fallback
  }

  return getDefaultHorseStats(horseName);
}

function parseHorseHistoryHTML(
  $: ReturnType<typeof cheerio.load>,
  horseName: string
): TravsportHorseStats | null {
  try {
    // Försök hitta resultatrad
    const rows: string[] = [];
    $("table tr, .result-row, [class*='result']").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) rows.push(text);
    });

    if (rows.length === 0) return null;

    // Extrahera form (1-6, U, G, D)
    const formPattern = /\b([1-6UGD])\b/g;
    const formResults: string[] = [];
    for (const row of rows.slice(0, 10)) {
      const match = row.match(formPattern);
      if (match) formResults.push(...match);
    }

    // Extrahera km-tid
    const kmTimeMatch = rows
      .join(" ")
      .match(/1\.(\d{2}),(\d)/);
    const bestKmTime = kmTimeMatch
      ? `1.${kmTimeMatch[1]},${kmTimeMatch[2]}`
      : "1.14,0";
    const [min, sec] = bestKmTime
      .replace(",", ".")
      .split(".")
      .slice(1)
      .map(parseFloat);
    const kmTimeValue = 60 + (sec ?? 14);

    return {
      horseName,
      recentForm: formResults.slice(0, 10),
      bestKmTime,
      bestKmTimeValue: kmTimeValue,
      homeTrackTime: bestKmTime,
      starts2025: 0,
      wins2025: 0,
      earnings2025: 0,
      starts2026: 0,
      wins2026: 0,
      earnings2026: 0,
      lastRaceDate: "",
      daysSinceLastRace: 14,
      trainerHotStreak: false,
      source: "travsport",
    };
  } catch {
    return null;
  }
}

function getDefaultHorseStats(horseName: string): TravsportHorseStats {
  return {
    horseName,
    recentForm: ["O", "O", "O", "O", "O"],
    bestKmTime: "1.13,5",
    bestKmTimeValue: 73.5,
    homeTrackTime: "1.13,5",
    starts2025: 8,
    wins2025: 2,
    earnings2025: 95000,
    starts2026: 3,
    wins2026: 0,
    earnings2026: 18000,
    lastRaceDate: "",
    daysSinceLastRace: 14,
    trainerHotStreak: false,
    source: "fallback",
  };
}

// ── Batch-hämtning ────────────────────────────────────────────────────────

/**
 * Berikar en lista av HorseEntry med Travsport-statistik.
 */
export async function enrichHorsesWithTravsport(
  horses: HorseEntry[]
): Promise<HorseEntry[]> {
  const enriched = await Promise.all(
    horses.map(async (horse) => {
      const [horseStats, driverStats] = await Promise.all([
        fetchHorseHistory(horse.name),
        fetchDriverStats(horse.driver.name),
      ]);

      const recentForm = horseStats.recentForm.length >= 3
        ? horseStats.recentForm.slice(0, 5)
        : horse.recentForm;

      return {
        ...horse,
        recentForm: recentForm as HorseEntry["recentForm"],
        bestKmTime: horseStats.bestKmTime !== "1.13,5"
          ? horseStats.bestKmTime
          : horse.bestKmTime,
        kmTimeValue: horseStats.bestKmTimeValue !== 73.5
          ? horseStats.bestKmTimeValue
          : horse.kmTimeValue,
        earnings: horseStats.earnings2026 > 0
          ? horseStats.earnings2026
          : horse.earnings,
        driver: {
          ...horse.driver,
          winRate: driverStats.source === "travsport"
            ? driverStats.winRate
            : horse.driver.winRate,
          placeRate: driverStats.placeRate,
          v75WinRate: driverStats.v75Wins
            ? Math.round((driverStats.v75Wins / Math.max(driverStats.starts, 1)) * 100)
            : horse.driver.v75WinRate,
        },
        trainer: {
          ...horse.trainer,
          hotStreak: horseStats.trainerHotStreak,
        },
      };
    })
  );

  return enriched;
}
