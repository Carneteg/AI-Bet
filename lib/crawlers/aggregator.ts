/**
 * Data-aggregator — kombinerar alla datakällor till en komplett analys.
 *
 * Datakällor och vad de bidrar med:
 *
 * 1. ATG API          → Startlistor, exakt streckning, poolstorlek, odds
 * 2. Travsport.se     → Hästars fullständiga form, km-tider, tränarstatistik
 * 3. Aftonbladet      → Expert-bankare, skrällar (travtips + stryktips)
 * 4. Expressen        → Expert-bankare, skrällar (cross-validation)
 * 5. Vår Poisson-modell → Beräknade sannolikheter, value scores
 * 6. Kelly Criterion  → Optimal insatsstorlek
 *
 * Prioritetsordning för datakonflikter:
 * ATG (streckning) > Travsport (form/tider) > Poisson-modell > Fallback
 */

import type { Race, V75Coupon, HorseEntry } from "@/data/horseTypes";
import { fetchATGRaceDay } from "./atgCrawler";
import { enrichHorsesWithTravsport } from "./travsportCrawler";
import { crawlAllNewsSources, adjustValueWithExpertTips } from "./newsCrawler";
import { analyzeRace, classifyRaceDifficulty, findTopSkrall } from "@/lib/horseAnalysis";
import { getV75Data } from "@/data/v75Data";

// ── Typer ─────────────────────────────────────────────────────────────────

export interface DataSourceStatus {
  atg: "live" | "failed";
  travsport: "live" | "partial" | "fallback";
  aftonbladet: "live" | "failed";
  expressen: "live" | "failed";
  lastUpdated: string;
  horsesEnriched: number;
  tipsFound: number;
}

export interface EnrichedV75Coupon extends V75Coupon {
  dataStatus: DataSourceStatus;
  expertTipsSummary: {
    bankers: string[];
    skrällar: string[];
    sources: string[];
  };
}

// ── Kärn-aggregering ──────────────────────────────────────────────────────

/**
 * Hämtar och kombinerar data från alla källor.
 * Kör parallellt för minimal laddningstid.
 */
export async function aggregateV75Data(): Promise<EnrichedV75Coupon> {
  const startTime = Date.now();

  // Kör alla datakällor parallellt
  const [atgData, newsAnalysis] = await Promise.all([
    fetchATGRaceDay("V75"),
    crawlAllNewsSources(),
  ]);

  // Status-tracking
  const status: DataSourceStatus = {
    atg: atgData ? "live" : "failed",
    travsport: "fallback",
    aftonbladet: newsAnalysis.sources.includes("Aftonbladet") ? "live" : "failed",
    expressen: newsAnalysis.sources.includes("Expressen") ? "live" : "failed",
    lastUpdated: new Date().toISOString(),
    horsesEnriched: 0,
    tipsFound: newsAnalysis.v75Tips.length,
  };

  // Använd ATG-data om tillgänglig, annars fallback
  const baseData = atgData ?? (await getV75Data());

  // Berika hästar med Travsport-statistik
  const enrichedRaces = await Promise.all(
    baseData.races.map(async (race) => {
      try {
        const enrichedEntries = await enrichHorsesWithTravsport(race.entries);
        status.horsesEnriched += enrichedEntries.length;

        // Kör analysmotor på berikad data
        const analyzed = analyzeRace({ ...race, entries: enrichedEntries });

        // Justera value scores med expert-tips
        const withTips = analyzed.map((horse) => ({
          ...horse,
          valueScore: adjustValueWithExpertTips(horse, newsAnalysis.v75Tips),
        }));

        const difficulty = classifyRaceDifficulty({ ...race, entries: withTips });
        const topSkrall = findTopSkrall(withTips) ?? undefined;
        const banker = withTips.find((h) => h.recommendation === "banker");

        return {
          ...race,
          entries: withTips,
          difficulty,
          topSkrall,
          recommendedBanker: banker?.number,
          isGarderable: difficulty !== "enkel",
        };
      } catch {
        return race;
      }
    })
  );

  // Beräkna total rader i kupong
  const totalRows = enrichedRaces.reduce((acc, race) => {
    const played = race.entries.filter(
      (h) => h.recommendation !== "stryk"
    ).length;
    return acc * Math.max(played, 1);
  }, 1);
  const cappedRows = Math.min(totalRows, 9999);

  // Identifiera vilka av tidstipsens skrällar som stämmer med vår analys
  const ourSkrällar = enrichedRaces
    .flatMap((r) => r.entries)
    .filter((h) => h.isSkrall)
    .map((h) => h.name.toLowerCase());

  const confirmedSkrällar = newsAnalysis.consensusSkrällar.filter((s) =>
    ourSkrällar.some((o) => o.includes(s) || s.includes(o))
  );

  if (status.horsesEnriched > 0) {
    status.travsport = status.horsesEnriched > baseData.races.length * 2
      ? "live"
      : "partial";
  }

  console.log(
    `[Aggregator] Klart på ${Date.now() - startTime}ms. ` +
    `ATG:${status.atg} Travsport:${status.travsport} ` +
    `Tips:${status.tipsFound} Hästar:${status.horsesEnriched}`
  );

  return {
    ...baseData,
    races: enrichedRaces,
    totalRows: cappedRows,
    estimatedCost: cappedRows * 1,
    dataStatus: status,
    expertTipsSummary: {
      bankers: newsAnalysis.consensusBankers,
      skrällar: confirmedSkrällar,
      sources: newsAnalysis.sources,
    },
  };
}

/**
 * Aggregerar fotbollsdata från alla källor.
 * Kombinerar football-data.org matcher med tidningstips.
 */
export async function aggregateFootballData() {
  const [newsAnalysis] = await Promise.all([crawlAllNewsSources()]);

  return {
    footballTips: newsAnalysis.footballTips,
    sources: newsAnalysis.sources,
    fetchedAt: newsAnalysis.fetchedAt,
  };
}

// ── Cache-hantering ───────────────────────────────────────────────────────

let _v75Cache: { data: EnrichedV75Coupon; cachedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minuter

/**
 * Cachad version av aggregeringen — undviker onödiga API-anrop.
 */
export async function getCachedV75Data(): Promise<EnrichedV75Coupon> {
  const now = Date.now();

  if (_v75Cache && now - _v75Cache.cachedAt < CACHE_TTL) {
    return _v75Cache.data;
  }

  const data = await aggregateV75Data();
  _v75Cache = { data, cachedAt: now };
  return data;
}

/**
 * Tvingar omladdning av all data (för manuell refresh-knapp).
 */
export async function forceRefreshV75Data(): Promise<EnrichedV75Coupon> {
  _v75Cache = null;
  return getCachedV75Data();
}

// ── Källstatus-helpers ────────────────────────────────────────────────────

export function getSourceBadge(
  status: "live" | "failed" | "partial" | "fallback"
): { label: string; cls: string } {
  const map = {
    live: { label: "● Live", cls: "text-accent-green border-accent-green/30 bg-accent-green/10" },
    partial: { label: "◐ Delvis", cls: "text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10" },
    fallback: { label: "○ Exempel", cls: "text-slate-400 border-slate-600 bg-slate-700/30" },
    failed: { label: "✕ Otillgänglig", cls: "text-accent-red border-accent-red/30 bg-accent-red/10" },
  };
  return map[status];
}
