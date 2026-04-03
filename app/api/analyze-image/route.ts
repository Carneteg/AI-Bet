import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Du är en expert på att analysera bilder av fotbollsmatcher, stryktipskuponger och oddstavlor.

Din uppgift är att extrahera matchinformation från bilden och returnera den som strukturerad JSON.

För varje match du hittar i bilden, returnera:
- homeTeam: hemmalagets namn (sträng)
- awayTeam: bortalag (sträng)
- league: liganamn om synligt, annars null
- probability: ditt estimat av sannolikhet för 1/X/2 baserat på odds/streckprocent (0-100, summerar till 100)
- streckning: streckprocent för 1/X/2 om synlig i bilden (0-100, summerar till 100). Om ej synlig, estimera baserat på odds.
- odds: odds för 1/X/2 om synliga, annars null
- rawText: en kort beskrivning av vad du ser för just denna match

VIKTIGT:
- Returnera ALLTID giltig JSON, inget annat
- Om bilden inte innehåller matchinformation, returnera: {"matches": [], "error": "Ingen matchdata hittade"}
- Normalisera alltid probability och streckning så de summerar till 100
- Lag med hög streckning (>60%) är favoriter, hämta det från odds eller synlig data
- Format: {"matches": [...]}
`;

// --- Rate limiting (in-memory, per-IP, resets on cold start) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

// --- Type guards for OpenAI response ---
function toNumberRecord(value: unknown): Record<"home" | "draw" | "away", number> {
  const defaults = { home: 45, draw: 25, away: 30 };
  if (typeof value !== "object" || value === null) return defaults;
  const obj = value as Record<string, unknown>;
  return {
    home: typeof obj.home === "number" && Number.isFinite(obj.home) ? obj.home : defaults.home,
    draw: typeof obj.draw === "number" && Number.isFinite(obj.draw) ? obj.draw : defaults.draw,
    away: typeof obj.away === "number" && Number.isFinite(obj.away) ? obj.away : defaults.away,
  };
}

function toOddsRecord(value: unknown): Record<"home" | "draw" | "away", number> | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.home !== "number" ||
    typeof obj.draw !== "number" ||
    typeof obj.away !== "number"
  ) return null;
  return { home: obj.home, draw: obj.draw, away: obj.away };
}

/** Normalize so home+draw+away sum to exactly 100, preserving ratios. */
function normalizeToHundred(
  rec: Record<"home" | "draw" | "away", number>
): Record<"home" | "draw" | "away", number> {
  const total = rec.home + rec.draw + rec.away;
  if (total <= 0) return { home: 45, draw: 25, away: 30 };
  const home = Math.round((rec.home / total) * 100);
  const draw = Math.round((rec.draw / total) * 100);
  const away = 100 - home - draw; // guarantee exact sum of 100
  return { home, draw, away };
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen om en minut." },
      { status: 429 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY är inte konfigurerad." },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "Ingen bild skickades." }, { status: 400 });
    }
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Bilden är för stor. Max 10 MB." }, { status: 400 });
    }

    // Convert to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
              },
              {
                type: "text",
                text: "Analysera denna bild och extrahera alla matcher du kan se. Returnera som JSON.",
              },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errData = await openaiRes.json().catch(() => ({}));
      const msg =
        (errData as { error?: { message?: string } })?.error?.message ??
        `OpenAI API svarade med status ${openaiRes.status}`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const openaiData = await openaiRes.json();
    const rawContent: string = openaiData.choices?.[0]?.message?.content ?? "{}";

    let parsed: { matches?: unknown[]; error?: string };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "Kunde inte tolka AI-svaret. Försök med en tydligare bild." },
        { status: 422 }
      );
    }

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error, matches: [] });
    }

    const matches = (Array.isArray(parsed.matches) ? parsed.matches : []).map(
      (m: unknown) => {
        const match = typeof m === "object" && m !== null ? (m as Record<string, unknown>) : {};

        const homeTeam = typeof match.homeTeam === "string" && match.homeTeam.trim()
          ? match.homeTeam.trim()
          : "Okänt hemmalag";
        const awayTeam = typeof match.awayTeam === "string" && match.awayTeam.trim()
          ? match.awayTeam.trim()
          : "Okänt bortalag";

        return {
          homeTeam,
          awayTeam,
          league: typeof match.league === "string" ? match.league : null,
          probability: normalizeToHundred(toNumberRecord(match.probability)),
          streckning: normalizeToHundred(toNumberRecord(match.streckning)),
          odds: toOddsRecord(match.odds),
          rawText: typeof match.rawText === "string" ? match.rawText : null,
        };
      }
    );

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("analyze-image error:", err);
    return NextResponse.json({ error: "Internt serverfel. Försök igen." }, { status: 500 });
  }
}
