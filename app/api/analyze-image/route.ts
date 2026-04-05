import { NextRequest, NextResponse } from "next/server";
import { getAiApiKey } from "@/lib/config";

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
  // Robustly extract and clean keys from environment
  const cleanKey = (key: string | undefined) => key?.trim().replace(/^["']|["']$/g, "");
  
  const openaiKeyRaw = process.env.OPENAI_API_KEY;
  const anthropicKeyRaw = process.env.ANTHROPIC_API_KEY;
  
  const openaiKey = cleanKey(openaiKeyRaw);
  const anthropicKey = cleanKey(anthropicKeyRaw);
  
  // Detection logic: prioritize the key that matches the provider's format
  let apiKey: string | undefined;
  let provider: 'openai' | 'anthropic' = 'openai';

  // Check if either key is explicitly an Anthropic key
  if (openaiKey?.startsWith('sk-ant') || anthropicKey?.startsWith('sk-ant')) {
    apiKey = openaiKey?.startsWith('sk-ant') ? openaiKey : anthropicKey;
    provider = 'anthropic';
  } else {
    apiKey = openaiKey || anthropicKey;
    provider = 'openai';
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Ingen API-nyckel konfigurerad. Kontrollera OPENAI_API_KEY eller ANTHROPIC_API_KEY i serverinställningarna.",
        diagnostics: { openaiSet: !!openaiKey, anthropicSet: !!anthropicKey }
      },
      { status: 503 }
    );
  }

  const isAnthropic = provider === 'anthropic';

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

    let rawContent = "{}";

    if (isAnthropic) {
      // Anthropic Claude Sonnet 4.6
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mimeType,
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: "Analysera denna bild och extrahera alla matcher du kan se. Returnera som JSON enligt formatet i system_prompt.",
                },
              ],
            },
          ],
        }),
      });

      if (!anthropicRes.ok) {
        const errData = await anthropicRes.json().catch(() => ({}));
        const msg = errData?.error?.message ?? `Anthropic API svarade med status ${anthropicRes.status}`;
        return NextResponse.json({ error: msg }, { status: 502 });
      }

      const anthropicData = await anthropicRes.json();
      rawContent = anthropicData.content?.[0]?.text ?? "{}";
    } else {
      // OpenAI GPT-4o
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
      rawContent = openaiData.choices?.[0]?.message?.content ?? "{}";
    }

    let parsed: { matches?: unknown[]; error?: string };
    try {
      // Strip markdown JSON blocks if present (common with Claude)
      const cleanJson = rawContent.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleanJson);
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

      const probTotal = (Number(prob.home) ?? 0) + (Number(prob.draw) ?? 0) + (Number(prob.away) ?? 0);
      const streckTotal = (Number(streck.home) ?? 0) + (Number(streck.draw) ?? 0) + (Number(streck.away) ?? 0);

      return {
        homeTeam: match.homeTeam ?? "Okänt hemmalag",
        awayTeam: match.awayTeam ?? "Okänt bortalag",
        league: match.league ?? null,
        probability: {
          home: probTotal > 0 ? Math.round((Number(prob.home) / probTotal) * 100) : 45,
          draw: probTotal > 0 ? Math.round((Number(prob.draw) / probTotal) * 100) : 25,
          away: probTotal > 0 ? Math.round((Number(prob.away) / probTotal) * 100) : 30,
        },
        streckning: {
          home: streckTotal > 0 ? Math.round((Number(streck.home) / streckTotal) * 100) : 45,
          draw: streckTotal > 0 ? Math.round((Number(streck.draw) / streckTotal) * 100) : 25,
          away: streckTotal > 0 ? Math.round((Number(streck.away) / streckTotal) * 100) : 30,
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
