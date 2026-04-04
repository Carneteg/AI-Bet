/**
 * GET /api/crawl/status — Returnerar aktuell status för alla datakällor.
 * Alias för GET /api/crawl, avsett för hälsokontroller och dashboards.
 */

import { NextResponse } from "next/server";
import { getCachedV75Data } from "@/lib/crawlers/aggregator";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCachedV75Data();
    return NextResponse.json({
      ok: true,
      status: data.dataStatus,
      summary: {
        races: data.races.length,
        horses: data.races.reduce((s, r) => s + r.entries.length, 0),
        expertTips: data.expertTipsSummary,
        poolSize: data.poolSize,
        totalRows: data.totalRows,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Kunde inte hämta status", details: String(error) },
      { status: 500 }
    );
  }
}
