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

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY är inte konfigurerad. Lägg till den i Render Environment Variables.",
      },
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
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "high",
                },
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
      const msg = errData?.error?.message ?? `OpenAI API svarade med status ${openaiRes.status}`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const openaiData = await openaiRes.json();
    const rawContent = openaiData.choices?.[0]?.message?.content ?? "{}";

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

    const matches = (parsed.matches ?? []).map((m: unknown) => {
      const match = m as Record<string, unknown>;
      // Normalize probabilities to sum to 100
      const prob = match.probability as Record<string, number> ?? { home: 45, draw: 25, away: 30 };
      const streck = match.streckning as Record<string, number> ?? { home: 45, draw: 25, away: 30 };

      const probTotal = (prob.home ?? 0) + (prob.draw ?? 0) + (prob.away ?? 0);
      const streckTotal = (streck.home ?? 0) + (streck.draw ?? 0) + (streck.away ?? 0);

      return {
        homeTeam: match.homeTeam ?? "Okänt hemmalag",
        awayTeam: match.awayTeam ?? "Okänt bortalag",
        league: match.league ?? null,
        probability: {
          home: probTotal > 0 ? Math.round((prob.home / probTotal) * 100) : 45,
          draw: probTotal > 0 ? Math.round((prob.draw / probTotal) * 100) : 25,
          away: probTotal > 0 ? Math.round((prob.away / probTotal) * 100) : 30,
        },
        streckning: {
          home: streckTotal > 0 ? Math.round((streck.home / streckTotal) * 100) : 45,
          draw: streckTotal > 0 ? Math.round((streck.draw / streckTotal) * 100) : 25,
          away: streckTotal > 0 ? Math.round((streck.away / streckTotal) * 100) : 30,
        },
        odds: match.odds ?? null,
        rawText: match.rawText ?? null,
      };
    });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("analyze-image error:", err);
    return NextResponse.json(
      { error: "Internt serverfel. Försök igen." },
      { status: 500 }
    );
  }
}
