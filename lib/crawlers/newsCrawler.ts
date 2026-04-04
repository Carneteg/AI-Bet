/**
 * Nyhetstips-crawler: Aftonbladet, Expressen, V75Tips.se
 *
 * Hämtar experttips för V75/V86 och Stryktips från svenska medier.
 *
 * Vad vi letar efter:
 * - Bankare (häst/fotbollslag som experten är säker på)
 * - Skräll-tips (overrated underdogs)
 * - Garderingar
 * - Streckning-kommentarer
 *
 * VIKTIGT: Experttips används som EN av flera signaler, inte som sanning.
 * Hög konsensus bland tipsters → publiken vet om det → lägre pool-value.
 * Låg konsensus på en häst vi gillar = optimalt läge.
 */

import * as cheerio from "cheerio";
import type { HorseEntry } from "@/data/horseTypes";

// ── Typer ─────────────────────────────────────────────────────────────────

export interface ExpertTip {
  source: string;          // "Aftonbladet" | "Expressen" | "V75Tips"
  expertName: string;
  horseName?: string;      // För travtips
  teamName?: string;       // För fotbollstips
  tipType: "bankare" | "skräll" | "gardering" | "spel";
  confidence: number;      // 1-5
  comment?: string;
  raceNumber?: number;
  fetchedAt: string;
}

export interface NewsAnalysis {
  v75Tips: ExpertTip[];
  footballTips: ExpertTip[];
  consensusBankers: string[];   // Hästar/lag som ALLA tipsters pekar på
  consensusSkrällar: string[];  // Skrällar som FÅ tipsters pekar på (hög value)
  expertDisagreements: string[]; // Matcher/lopp där tipsters är oeniga
  fetchedAt: string;
  sources: string[];
}

// ── Fetch-helper ──────────────────────────────────────────────────────────

async function fetchHTML(url: string, timeout = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 1800 }, // Cache 30 min
    });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── Aftonbladet V75-crawler ───────────────────────────────────────────────

export async function crawlAftonbladetV75(): Promise<ExpertTip[]> {
  const tips: ExpertTip[] = [];

  const html = await fetchHTML(
    "https://www.aftonbladet.se/sportbladet/travochgalopp/v75"
  );
  if (!html) return tips;

  const $ = cheerio.load(html);

  // Aftonbladet V75-tipssida — extrahera bankare och skrällar
  // Letar efter mönster som "Bankare:", "Skräll:", hästnamn i fet stil

  // Extrahera article-texter
  $("article, .article-body, [class*='article'], [class*='tips']").each(
    (_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();

      // Hitta bankare
      const bankarMatch = text.match(
        /[Bb]ankare[:\s]+([A-ZÅÄÖ][a-zåäö]+(?:\s[A-ZÅÄÖ][a-zåäö]+)*)/g
      );
      if (bankarMatch) {
        for (const match of bankarMatch) {
          const horseName = match
            .replace(/[Bb]ankare[:\s]+/, "")
            .trim();
          if (horseName.length > 2) {
            tips.push({
              source: "Aftonbladet",
              expertName: "Aftonbladet Trav",
              horseName,
              tipType: "bankare",
              confidence: 5,
              comment: `Aftonbladets bankare: ${horseName}`,
              fetchedAt: new Date().toISOString(),
            });
          }
        }
      }

      // Hitta skrällar
      const skrällMatch = text.match(
        /[Ss]kräll[:\s]+([A-ZÅÄÖ][a-zåäö]+(?:\s[A-ZÅÄÖ][a-zåäö]+)*)/g
      );
      if (skrällMatch) {
        for (const match of skrällMatch) {
          const horseName = match
            .replace(/[Ss]kräll[:\s]+/, "")
            .trim();
          if (horseName.length > 2) {
            tips.push({
              source: "Aftonbladet",
              expertName: "Aftonbladet Trav",
              horseName,
              tipType: "skräll",
              confidence: 4,
              comment: `Aftonbladets skräll: ${horseName}`,
              fetchedAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  );

  return tips;
}

// ── Expressen V75-crawler ─────────────────────────────────────────────────

export async function crawlExpressenV75(): Promise<ExpertTip[]> {
  const tips: ExpertTip[] = [];

  const html = await fetchHTML(
    "https://www.expressen.se/sport/travsport/v75/"
  );
  if (!html) return tips;

  const $ = cheerio.load(html);

  // Expressen har liknande struktur
  $("article, .article-body, [class*='trav'], h2, h3").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();

    // Bankare-mönster
    if (/bankare/i.test(text)) {
      // Försök extrahera hästnamnet efter "Bankare:"
      const parts = text.split(/bankare[:\s]*/i);
      if (parts[1]) {
        const horseName = parts[1]
          .split(/[,.\n]/)[0]
          .trim()
          .replace(/[^A-Za-zÅÄÖåäö\s]/g, "")
          .trim();
        if (horseName.length > 2 && horseName.length < 40) {
          tips.push({
            source: "Expressen",
            expertName: "Expressen Trav",
            horseName,
            tipType: "bankare",
            confidence: 5,
            comment: text.slice(0, 120),
            fetchedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Skräll-mönster
    if (/skräll/i.test(text)) {
      const parts = text.split(/skräll[:\s]*/i);
      if (parts[1]) {
        const horseName = parts[1]
          .split(/[,.\n]/)[0]
          .trim()
          .replace(/[^A-Za-zÅÄÖåäö\s]/g, "")
          .trim();
        if (horseName.length > 2 && horseName.length < 40) {
          tips.push({
            source: "Expressen",
            expertName: "Expressen Trav",
            horseName,
            tipType: "skräll",
            confidence: 4,
            comment: text.slice(0, 120),
            fetchedAt: new Date().toISOString(),
          });
        }
      }
    }
  });

  return tips;
}

// ── Aftonbladet Stryktips-crawler ─────────────────────────────────────────

export async function crawlAftonbladetStryktips(): Promise<ExpertTip[]> {
  const tips: ExpertTip[] = [];

  const html = await fetchHTML(
    "https://www.aftonbladet.se/sportbladet/stryktips"
  );
  if (!html) return tips;

  const $ = cheerio.load(html);

  $("article, .article-body, [class*='stryktips'], [class*='tips']").each(
    (_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length < 50) return;

      // Spik-mönster
      if (/spik/i.test(text)) {
        const parts = text.split(/spik[:\s]*/i);
        if (parts[1]) {
          const teamName = parts[1]
            .split(/[,()\n]/)[0]
            .trim()
            .slice(0, 50);
          if (teamName.length > 2) {
            tips.push({
              source: "Aftonbladet",
              expertName: "Aftonbladet Sport",
              teamName,
              tipType: "bankare",
              confidence: 5,
              comment: text.slice(0, 150),
              fetchedAt: new Date().toISOString(),
            });
          }
        }
      }

      // Skräll-mönster
      if (/skräll/i.test(text)) {
        const parts = text.split(/skräll[:\s]*/i);
        if (parts[1]) {
          const teamName = parts[1]
            .split(/[,()\n]/)[0]
            .trim()
            .slice(0, 50);
          if (teamName.length > 2) {
            tips.push({
              source: "Aftonbladet",
              expertName: "Aftonbladet Sport",
              teamName,
              tipType: "skräll",
              confidence: 4,
              comment: text.slice(0, 150),
              fetchedAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  );

  return tips;
}

// ── Expressen Stryktips-crawler ───────────────────────────────────────────

export async function crawlExpressenStryktips(): Promise<ExpertTip[]> {
  const tips: ExpertTip[] = [];

  const html = await fetchHTML(
    "https://www.expressen.se/sport/fotboll/stryktips/"
  );
  if (!html) return tips;

  const $ = cheerio.load(html);

  $("article, h2, h3, [class*='stryktips']").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();

    // Spik / Bankare
    if (/\bspik\b/i.test(text) || /\bbankare\b/i.test(text)) {
      tips.push({
        source: "Expressen",
        expertName: "Expressen Sport",
        teamName: text.slice(0, 80).trim(),
        tipType: "bankare",
        confidence: 4,
        comment: text.slice(0, 150),
        fetchedAt: new Date().toISOString(),
      });
    }
  });

  return tips;
}

// ── Aggregering ───────────────────────────────────────────────────────────

/**
 * Kör alla news-crawlers parallellt och sammanställer resultatet.
 */
export async function crawlAllNewsSources(): Promise<NewsAnalysis> {
  const [aftonV75, expressenV75, aftonStryktips, expressenStryktips] =
    await Promise.all([
      crawlAftonbladetV75(),
      crawlExpressenV75(),
      crawlAftonbladetStryktips(),
      crawlExpressenStryktips(),
    ]);

  const v75Tips = [...aftonV75, ...expressenV75];
  const footballTips = [...aftonStryktips, ...expressenStryktips];
  const allTips = [...v75Tips, ...footballTips];

  // Hitta konsensus-bankare (nämnda av flera källor)
  const bankarCount = new Map<string, number>();
  for (const tip of allTips.filter((t) => t.tipType === "bankare")) {
    const name = (tip.horseName ?? tip.teamName ?? "").toLowerCase();
    if (name) bankarCount.set(name, (bankarCount.get(name) ?? 0) + 1);
  }
  const consensusBankers = Array.from(bankarCount.entries())
    .filter(([, count]) => count >= 2)
    .map(([name]) => name);

  // Skrällar nämnda av bara EN källa = mer intressanta (publiken vet ej)
  const skrällCount = new Map<string, number>();
  for (const tip of allTips.filter((t) => t.tipType === "skräll")) {
    const name = (tip.horseName ?? tip.teamName ?? "").toLowerCase();
    if (name) skrällCount.set(name, (skrällCount.get(name) ?? 0) + 1);
  }
  const consensusSkrällar = Array.from(skrällCount.entries())
    .filter(([, count]) => count === 1) // Ensam skräll = bäst value
    .map(([name]) => name);

  const sources: string[] = [];
  if (aftonV75.length > 0 || aftonStryktips.length > 0)
    sources.push("Aftonbladet");
  if (expressenV75.length > 0 || expressenStryktips.length > 0)
    sources.push("Expressen");

  return {
    v75Tips,
    footballTips,
    consensusBankers,
    consensusSkrällar,
    expertDisagreements: [],
    fetchedAt: new Date().toISOString(),
    sources,
  };
}

/**
 * Justerar value score baserat på konsensus-tips.
 *
 * Logik:
 * - Alla tipsters gillar hästen → överstreckas snart → lägre pool-value
 * - Ensam tipster gillar hästen → fortfarande under radarn → bättre value
 */
export function adjustValueWithExpertTips(
  horse: HorseEntry,
  tips: ExpertTip[]
): number {
  const horseLower = horse.name.toLowerCase();
  const relatedTips = tips.filter(
    (t) => t.horseName?.toLowerCase().includes(horseLower)
  );

  if (relatedTips.length === 0) return horse.valueScore;

  const bankarTips = relatedTips.filter((t) => t.tipType === "bankare").length;
  const skrällTips = relatedTips.filter((t) => t.tipType === "skräll").length;

  let adjustment = 0;

  if (bankarTips >= 3) adjustment -= 8;       // Alla tipstar → publiken vet → lägre value
  else if (bankarTips === 2) adjustment -= 4;
  else if (bankarTips === 1) adjustment += 2;  // Ensam tipstar → fortfarande värde

  if (skrällTips >= 1) adjustment += 6;        // Skräll nämnts = extra pool-value

  return Math.min(100, Math.max(0, horse.valueScore + adjustment));
}
