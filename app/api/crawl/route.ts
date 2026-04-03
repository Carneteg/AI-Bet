/**
 * /api/crawl — Manuell refresh av alla datakällor.
 *
 * GET  /api/crawl          → Returnerar aktuell status för alla källor
 * POST /api/crawl          → Tvingar omladdning från alla källor
 * POST /api/crawl?type=v75 → Laddar om bara V75-data
 * POST /api/crawl?type=football → Laddar om bara fotbollsdata
 */

import { NextRequest, NextResponse } from "next/server";
import { forceRefreshV75Data, getCachedV75Data } from "@/lib/crawlers/aggregator";
import { crawlAllNewsSources } from "@/lib/crawlers/newsCrawler";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const data = await getCachedV75Data();
    return NextResponse.json({
      status: data.dataStatus,
      summary: {
        races: data.races.length,
        horses: data.races.reduce((s, r) => s + r.entries.length, 0),
        expertTips: data.expertTipsSummary,
        poolSize: data.poolSize,
        totalRows: data.totalRows,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Kunde inte hämta status", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";

  try {
    const startTime = Date.now();

    if (type === "v75" || type === "all") {
      const data = await forceRefreshV75Data();
      return NextResponse.json({
        ok: true,
        type: "v75",
        duration: Date.now() - startTime,
        status: data.dataStatus,
        races: data.races.length,
        horsesEnriched: data.dataStatus.horsesEnriched,
        tipsFound: data.dataStatus.tipsFound,
        expertSummary: data.expertTipsSummary,
      });
    }

    if (type === "news") {
      const news = await crawlAllNewsSources();
      return NextResponse.json({
        ok: true,
        type: "news",
        duration: Date.now() - startTime,
        sources: news.sources,
        v75TipsCount: news.v75Tips.length,
        footballTipsCount: news.footballTips.length,
        consensusBankers: news.consensusBankers,
        skrällar: news.consensusSkrällar,
      });
    }

    return NextResponse.json({ error: "Okänd typ" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Crawl misslyckades", details: String(error) },
      { status: 500 }
    );
  }
}
