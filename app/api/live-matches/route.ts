import { NextResponse } from "next/server";
import type { Match, Recommendation, Selection } from "@/data/matches";

export const maxDuration = 60;

// --- In-memory cache (resets on cold start / redeploy) ---
let cache: { matches: Match[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const SYSTEM_PROMPT = `Du är en expert på fotbollsanalys och Stryktips-betting (svenska poolspel).

Du får en lista med kommande fotbollsmatcher hämtad från ett live API. Din uppgift är att analysera varje match ur ett Stryktips-perspektiv och returnera strukturerad JSON.

För varje match, returnera ett objekt med exakt dessa fält:
- matchNumber: heltal (1, 2, 3 ...)
- homeTeam: hemmalagets namn (sträng)
- awayTeam: bortalag (sträng)
- league: tävlingens namn (sträng)
- date: matchdatum i formatet YYYY-MM-DD
- time: lokal starttid i formatet HH:MM (konvertera från UTC+0 till CET/CEST)
- odds: dina estimerade odds { home: number, draw: number, away: number }
- probabilities: din bedömning av sannolikhet { home: number, draw: number, away: number } — måste summera till exakt 100
- recommendation: en av "spik" | "gardering" | "skräll" | "normal"
  • spik = tydlig favorit med högt värde (valueScore ≥ 75, hemmasannolikhet ≥ 55)
  • skräll = underdog med överraskningspotential (edge ≥ 8, sannolikhet ≤ 30)
  • gardering = osäker match, spela flera tecken (valueScore < 50)
  • normal = övrigt
- recommendedSigns: array med en eller flera av "1", "X", "2"
- valueScore: 0–100 heltal (högt = bra värdespel för Stryktips)
- analysis: 1–2 meningar på svenska som motiverar din rekommendation
- homeForm: 5-teckens formsträng med "V" (vinst), "O" (oavgjort), "F" (förlust), t.ex. "VVOVF"
- awayForm: dito för bortalaget
- homeAdvantageFactor: decimaltal 1.0–1.3 baserat på lagets historiska hemmafördel

Returnera ALLTID giltig JSON i formatet: { "matches": [ ... ] }
Analysera varje match noggrant baserat på dina kunskaper om lagen, form, liga och historik.`;

// --- Fetch upcoming matches from football-data.org ---
async function fetchFootballMatches(): Promise<FootballApiMatch[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY saknas.");

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const res = await fetch(
    `https://api.football-data.org/v4/matches?dateFrom=${fmt(today)}&dateTo=${fmt(nextWeek)}&status=SCHEDULED,TIMED`,
    { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 0 } }
  );

  if (!res.ok) {
    throw new Error(`football-data.org svarade med status ${res.status}`);
  }

  const data = await res.json();
  return (data.matches ?? []) as FootballApiMatch[];
}

// --- Ask GPT-4o to analyze the matches ---
async function analyzeWithAI(rawMatches: FootballApiMatch[]): Promise<Match[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY saknas.");

  const matchList = rawMatches.map((m, i) => ({
    matchNumber: i + 1,
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    league: m.competition.name,
    utcDate: m.utcDate,
    status: m.status,
  }));

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analysera dessa ${matchList.length} kommande fotbollsmatcher:\n\n${JSON.stringify(matchList, null, 2)}`,
        },
      ],
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ??
        `OpenAI svarade med status ${openaiRes.status}`
    );
  }

  const openaiData = await openaiRes.json();
  const raw = openaiData.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { matches?: unknown[] };

  return (Array.isArray(parsed.matches) ? parsed.matches : [])
    .map((m: unknown, idx: number): Match | null => {
      if (typeof m !== "object" || m === null) return null;
      const obj = m as Record<string, unknown>;

      const probRaw = obj.probabilities as Record<string, number> | undefined;
      const prob = normalizeProbabilities(probRaw ?? { home: 40, draw: 30, away: 30 });

      const oddsRaw = obj.odds as Record<string, number> | undefined;

      const rec = isValidRecommendation(obj.recommendation)
        ? obj.recommendation
        : "normal";

      const signs = Array.isArray(obj.recommendedSigns)
        ? (obj.recommendedSigns as string[]).filter(isValidSign)
        : (["1"] as Selection[]);

      return {
        id: idx + 1,
        matchNumber: typeof obj.matchNumber === "number" ? obj.matchNumber : idx + 1,
        homeTeam: typeof obj.homeTeam === "string" ? obj.homeTeam : "Okänt hemmalag",
        awayTeam: typeof obj.awayTeam === "string" ? obj.awayTeam : "Okänt bortalag",
        league: typeof obj.league === "string" ? obj.league : "Okänd liga",
        date: typeof obj.date === "string" ? obj.date : new Date().toISOString().split("T")[0],
        time: typeof obj.time === "string" ? obj.time : "00:00",
        odds: {
          home: typeof oddsRaw?.home === "number" ? oddsRaw.home : 2.5,
          draw: typeof oddsRaw?.draw === "number" ? oddsRaw.draw : 3.2,
          away: typeof oddsRaw?.away === "number" ? oddsRaw.away : 2.8,
        },
        probabilities: prob,
        recommendation: rec,
        recommendedSigns: signs,
        valueScore: typeof obj.valueScore === "number"
          ? Math.min(100, Math.max(0, Math.round(obj.valueScore)))
          : 50,
        analysis: typeof obj.analysis === "string" ? obj.analysis : "",
        homeForm: isValidForm(obj.homeForm) ? (obj.homeForm as string) : "OOOOO",
        awayForm: isValidForm(obj.awayForm) ? (obj.awayForm as string) : "OOOOO",
        homeAdvantageFactor: typeof obj.homeAdvantageFactor === "number"
          ? Math.min(1.3, Math.max(1.0, obj.homeAdvantageFactor))
          : 1.1,
      };
    })
    .filter((m): m is Match => m !== null);
}

// --- Helpers ---
function normalizeProbabilities(
  p: Record<string, number>
): { home: number; draw: number; away: number } {
  const home = typeof p.home === "number" ? p.home : 40;
  const draw = typeof p.draw === "number" ? p.draw : 30;
  const away = typeof p.away === "number" ? p.away : 30;
  const total = home + draw + away;
  if (total <= 0) return { home: 40, draw: 30, away: 30 };
  const normHome = Math.round((home / total) * 100);
  const normDraw = Math.round((draw / total) * 100);
  return { home: normHome, draw: normDraw, away: 100 - normHome - normDraw };
}

function isValidRecommendation(v: unknown): v is Recommendation {
  return v === "spik" || v === "gardering" || v === "skräll" || v === "normal";
}

function isValidSign(v: unknown): v is Selection {
  return v === "1" || v === "X" || v === "2";
}

function isValidForm(v: unknown): v is string {
  return (
    typeof v === "string" &&
    v.length === 5 &&
    [...v].every((c) => c === "V" || c === "O" || c === "F")
  );
}

// --- Route handler ---
export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ matches: cache.matches, fetchedAt: cache.fetchedAt, cached: true });
  }

  try {
    const rawMatches = await fetchFootballMatches();

    if (rawMatches.length === 0) {
      return NextResponse.json({ matches: [], fetchedAt: Date.now(), cached: false });
    }

    // Limit to 13 matches (standard Stryktips coupon size)
    const limited = rawMatches.slice(0, 13);
    const analyzed = await analyzeWithAI(limited);

    cache = { matches: analyzed, fetchedAt: Date.now() };
    return NextResponse.json({ matches: analyzed, fetchedAt: cache.fetchedAt, cached: false });
  } catch (err) {
    console.error("live-matches error:", err);
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- Types for football-data.org response ---
interface FootballApiMatch {
  utcDate: string;
  status: string;
  homeTeam: { name: string; shortName: string };
  awayTeam: { name: string; shortName: string };
  competition: { name: string; code: string };
}
