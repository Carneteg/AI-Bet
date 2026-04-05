import { NextResponse } from "next/server";
import { fetchLiveMatches } from "@/lib/footballData";
import { matches as fallbackMatches } from "@/data/matches";

export const revalidate = 300; // Cache 5 min

export async function GET() {
  const live = await fetchLiveMatches(true);

  if (live && live.length > 0) {
    return NextResponse.json({ matches: live, source: "live" });
  }

  // Fallback: returnera hårdkodad data med uppdaterade datum
  return NextResponse.json({ matches: fallbackMatches, source: "fallback" });
}
