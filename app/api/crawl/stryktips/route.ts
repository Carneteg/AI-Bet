/**
 * GET /api/crawl/stryktips — Returnerar aktuella Stryktips-matcher.
 *
 * Prioriterar live-data via football-data.org; faller tillbaka på statisk data
 * om live-källan är otillgänglig. Returnerar alltid 13 matcher.
 */

import { NextResponse } from "next/server";
import { fetchLiveMatches } from "@/lib/footballData";
import { matches as fallbackMatches } from "@/data/matches";

export const revalidate = 300; // Cache 5 min

export async function GET() {
  try {
    const live = await fetchLiveMatches(false);

    if (live && live.length > 0) {
      const thirteen = live.slice(0, 13);
      return NextResponse.json({
        ok: true,
        source: "live",
        count: thirteen.length,
        matches: thirteen,
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    // fall through to fallback
  }

  return NextResponse.json({
    ok: true,
    source: "fallback",
    count: fallbackMatches.length,
    matches: fallbackMatches,
    timestamp: new Date().toISOString(),
  });
}
