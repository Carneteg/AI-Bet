import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Du är en expert på att analysera bilder av fotbollsmatcher, stryktipskuponger och oddstavlor.

Din uppgift är att extrahera matchinformation från bilden och returnera den som strukturerad JSON.

För varje match du hittar i bilden, returnera:
- homeTeam: hemmalagets namn (sträng)
- awayTeam: bortalag (sträng) 
- league: liganamn om synligt, annars null
- probability: ditt eget estimat av sannolikhet för 1/X/2 baserat på oddsen (0-100, summerar till 100). VIKTIGT: Beräkna detta individuellt per match baserat på oddsen! Omvandla odds till implicita sannolikheter och normalisera. Exempel: odds 2.0/3.5/4.0 → prob {home:47, draw:27, away:24}
- streckning: streckprocent för 1/X/2 som är synlig i bilden (0-100, summerar till 100). Läs av exakt från bilden. Om ej synlig, estimera baserat på odds.
- odds: odds för 1/X/2 om synliga som en array [homeOdds, drawOdds, awayOdds], annars null
- rawText: den exakta textraden från bilden för denna match, t.ex. "Arsenal - Chelsea, Svenska folket: 45%/25%/30%, Odds: 2.10/3.40/3.60"

VIKTIGT:
- Returnera ALLTID giltig JSON, inget annat
- Om bilden inte innehåller matchinformation, returnera: {"matches": [], "error": "Ingen matchdata hittade"}
- Beräkna probability individuellt per match från oddsen - INTE samma värde för alla matcher
- streckning ska läsas av direkt från bilden (Svenska folket / streckprocent)
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
                                max_tokens: 4000,
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
                                                                        text: "Analysera denna bild och extrahera alla matcher du kan se. Beräkna probability individuellt per match från oddsen. Returnera som JSON enligt formatet i system_prompt.",
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
                                max_tokens: 4000,
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
                                                                        text: "Analysera denna bild och extrahera alla matcher du kan se. Beräkna probability individuellt per match från oddsen. Returnera som JSON.",
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

                                                       // Safely extract probability object (avoid TypeScript ?? precedence issue)
                                                       const rawProb = match.probability;
              const prob: Record<string, number> = (rawProb !== null && rawProb !== undefined && typeof rawProb === 'object')
                ? rawProb as Record<string, number>
                        : { home: 45, draw: 25, away: 30 };

                                                       // Safely extract streckning object
                                                       const rawStreck = match.streckning;
              const streck: Record<string, number> = (rawStreck !== null && rawStreck !== undefined && typeof rawStreck === 'object')
                ? rawStreck as Record<string, number>
                        : { home: 45, draw: 25, away: 30 };

                                                       const probHome = Number(prob.home) || 0;
              const probDraw = Number(prob.draw) || 0;
              const probAway = Number(prob.away) || 0;
              const probTotal = probHome + probDraw + probAway;

                                                       const streckHome = Number(streck.home) || 0;
              const streckDraw = Number(streck.draw) || 0;
              const streckAway = Number(streck.away) || 0;
              const streckTotal = streckHome + streckDraw + streckAway;

                                                       // If probability wasn't provided by AI or is all zeros, calculate from odds
                                                       let finalProbHome: number;
              let finalProbDraw: number;
              let finalProbAway: number;

                                                       if (probTotal > 0) {
                                                                 finalProbHome = Math.round((probHome / probTotal) * 100);
                                                                 finalProbDraw = Math.round((probDraw / probTotal) * 100);
                                                                 finalProbAway = 100 - finalProbHome - finalProbDraw;
                                                       } else {
                                                                 // Fallback: calculate from odds if available
                const odds = match.odds as number[] | null;
                                                                 if (Array.isArray(odds) && odds.length >= 3 && odds[0] > 0 && odds[1] > 0 && odds[2] > 0) {
                                                                             const impliedHome = 1 / odds[0];
                                                                             const impliedDraw = 1 / odds[1];
                                                                             const impliedAway = 1 / odds[2];
                                                                             const impliedTotal = impliedHome + impliedDraw + impliedAway;
                                                                             finalProbHome = Math.round((impliedHome / impliedTotal) * 100);
                                                                             finalProbDraw = Math.round((impliedDraw / impliedTotal) * 100);
                                                                             finalProbAway = 100 - finalProbHome - finalProbDraw;
                                                                 } else {
                                                                             finalProbHome = 45;
                                                                             finalProbDraw = 25;
                                                                             finalProbAway = 30;
                                                                 }
                                                       }

                                                       return {
                                                                 homeTeam: match.homeTeam ?? "Okänt hemmalag",
                                                                 awayTeam: match.awayTeam ?? "Okänt bortalag",
                                                                 league: match.league ?? null,
                                                                 probability: {
                                                                             home: finalProbHome,
                                                                             draw: finalProbDraw,
                                                                             away: finalProbAway,
                                                                 },
                                                                 streckning: {
                                                                             home: streckTotal > 0 ? Math.round((streckHome / streckTotal) * 100) : 45,
                                                                             draw: streckTotal > 0 ? Math.round((streckDraw / streckTotal) * 100) : 25,
                                                                             away: streckTotal > 0 ? Math.round((streckAway / streckTotal) * 100) : 30,
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
