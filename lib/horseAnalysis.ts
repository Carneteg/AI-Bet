/**
 * Häst- och travanalys-motor för V75/V86.
 *
 * Rankingmodell baserad på beprövad travbetting-metodik:
 *
 * 1. FORMPOÄNG (40%): Senaste 5 lopp viktas exponentiellt (nyaste mest)
 * 2. TIDSRATING (25%): Bästa km-tid normaliserat mot loppets fält
 * 3. KUSK-BONUS (20%): Toppkuskar presterar konsekvent bättre
 * 4. SPÅRFÖRDEL (10%): Inre spår i volt ger klar fördel
 * 5. STRECKNING-EDGE (bonus): Pool-value mot publikens estimat
 */

import type { HorseEntry, Race, HorseForm } from "@/data/horseTypes";

// ── Formpoäng ─────────────────────────────────────────────────────────────

const FORM_SCORES: Record<HorseForm, number> = {
  "1": 10,  // Seger
  "2": 7,   // Andraplacering
  "3": 5,   // Tredjeplacering
  "4": 3,
  "5": 2,
  "6": 1,
  "U": -3,  // Utgånget — negativt signal
  "G": -5,  // Galopperat — starkt negativt
  "D": -4,  // Diskad
  "0": 0,   // Ej startat
};

const FORM_WEIGHTS = [1.0, 0.8, 0.6, 0.4, 0.2]; // Nyaste loppet viktas mest

export function calculateFormScore(form: HorseForm[]): number {
  let score = 0;
  let totalWeight = 0;
  for (let i = 0; i < Math.min(form.length, 5); i++) {
    const weight = FORM_WEIGHTS[i];
    score += (FORM_SCORES[form[i]] ?? 0) * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? score / totalWeight : 0;
}

// ── Km-tidsrating ─────────────────────────────────────────────────────────

/**
 * Konverterar km-tid-sträng till numeriskt värde.
 * "1.12,5" → 72.5 sekunder per km
 */
export function parseKmTime(kmTime: string): number {
  const match = kmTime.match(/(\d+)\.(\d+),(\d+)/);
  if (!match) return 80; // Okänd tid — anta medelmåttlig
  const minutes = parseInt(match[1]);
  const seconds = parseInt(match[2]);
  const tenths = parseInt(match[3]);
  return minutes * 60 + seconds + tenths / 10;
}

/**
 * Normaliserar km-tid mot fältets bästa tid.
 * Returnerar 0-100 (100 = bäst i fältet).
 */
export function normalizeKmTime(horse: HorseEntry, field: HorseEntry[]): number {
  const times = field.map((h) => h.kmTimeValue).filter((t) => t < 90);
  if (times.length === 0) return 50;
  const best = Math.min(...times);
  const worst = Math.max(...times);
  if (worst === best) return 50;
  // Lägre tid = bättre → inverterat
  return Math.round(((worst - horse.kmTimeValue) / (worst - best)) * 100);
}

// ── Spårfördel ────────────────────────────────────────────────────────────

/**
 * Volt-start: Spår 1-4 har stor fördel.
 * Auto-start: Spårfördelen är minimal.
 *
 * Baserat på svensk travstatistik:
 * Spår 1: ~18% seger, Spår 2: ~15%, Spår 3: ~13%, ...
 * Mot normalvärde ~10% (10 hästar)
 */
export function calculatePostPositionBonus(
  postPosition: number,
  startType: "volt" | "auto",
  fieldSize: number
): number {
  if (startType === "auto") return 0;

  const voltBonuses: Record<number, number> = {
    1: 8, 2: 5, 3: 3, 4: 1, 5: 0, 6: -1, 7: -2, 8: -3,
    9: -4, 10: -5, 11: -6, 12: -6,
  };
  // Extra straff för tilläggsstartar (spår > 8, startar efter huvudfältet)
  const isExtra = postPosition > fieldSize / 2 + 3;
  const base = voltBonuses[postPosition] ?? -6;
  return isExtra ? base - 2 : base;
}

// ── Kusk-bonus ────────────────────────────────────────────────────────────

export function calculateDriverBonus(winRate: number): number {
  // Toppkuskar (>25% vinstfrekvens) ger +5 till +10 bonus
  if (winRate >= 30) return 10;
  if (winRate >= 25) return 7;
  if (winRate >= 20) return 4;
  if (winRate >= 15) return 1;
  if (winRate >= 10) return 0;
  return -2;
}

// ── Sammansatt rating ─────────────────────────────────────────────────────

export interface HorseRating {
  total: number;        // Sammansatt rating 0-100
  formScore: number;
  timeRating: number;
  driverBonus: number;
  postBonus: number;
  estimatedWinProb: number; // Estimerad vinstchans (0-100)
}

export function rateHorse(horse: HorseEntry, race: Race): HorseRating {
  const fieldSize = race.entries.length;

  const formScore = calculateFormScore(horse.recentForm);
  const timeRating = normalizeKmTime(horse, race.entries);
  const driverBonus = calculateDriverBonus(horse.driver.winRate);
  const postBonus = calculatePostPositionBonus(
    horse.postPosition,
    horse.startType,
    fieldSize
  );

  // Viktad sammansättning
  const raw =
    formScore * 4.0 +      // Form viktas högst
    timeRating * 0.25 +    // Tid normaliseras till 0-25
    driverBonus +
    postBonus;

  // Normalisera till 0-100
  const total = Math.min(100, Math.max(0, Math.round(50 + raw * 1.5)));

  // Estimerad vinstchans: softmax-approximation
  // Högt rating → högre vinstchans, men aldrig mer än 80%
  const estimatedWinProb = Math.min(80, Math.max(2, Math.round(total * 0.6)));

  return {
    total,
    formScore: Math.round(formScore * 10) / 10,
    timeRating,
    driverBonus,
    postBonus,
    estimatedWinProb,
  };
}

// ── Pool-edge och value ───────────────────────────────────────────────────

/**
 * Beräknar pool-edge mot streckning.
 * Positivt edge = hästen är undervärderad av publiken.
 *
 * Stryckning-edge = estimerad vinstchans - streckningsprocent
 */
export function calculateHorsePoolEdge(
  estimatedWinProb: number,
  streckning: number
): number {
  return Math.round((estimatedWinProb - streckning) * 10) / 10;
}

/**
 * Beräknar value score för häst (0-100).
 * Kombinerar rating med pool-edge.
 */
export function calculateHorseValueScore(
  rating: HorseRating,
  streckning: number
): number {
  const poolEdge = calculateHorsePoolEdge(rating.estimatedWinProb, streckning);
  // Rating ger basen, pool-edge justerar
  const raw = rating.total * 0.6 + (50 + poolEdge * 2) * 0.4;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Rekommenderar om hästen ska spelas, stryktas, eller är skräll/bankare.
 */
export function recommendHorse(
  rating: HorseRating,
  streckning: number,
  fieldSize: number
): HorseEntry["recommendation"] {
  const poolEdge = calculateHorsePoolEdge(rating.estimatedWinProb, streckning);
  const valueScore = calculateHorseValueScore(rating, streckning);

  // Bankare: hög rating + streckning rimlig (inte för överstreckat)
  if (rating.total >= 75 && streckning <= 55) return "banker";

  // Skräll: låg streckning men god rating + positivt pool-edge
  if (
    streckning <= 8 &&
    rating.estimatedWinProb >= 12 &&
    poolEdge >= 6
  )
    return "skräll";

  // Gardering: mellanklass med positivt pool-edge
  if (valueScore >= 55 && poolEdge >= 3) return "gardering";

  // Spel: bra rating men inget skräll-värde
  if (valueScore >= 50) return "spel";

  // Stryk: låg rating
  return "stryk";
}

// ── Loppanalys ────────────────────────────────────────────────────────────

/**
 * Analyserar ett helt lopp och rankar alla hästar.
 * Returnerar hästar sorterade på value score.
 */
export function analyzeRace(race: Race): HorseEntry[] {
  return race.entries
    .map((horse) => {
      const rating = rateHorse(horse, race);
      const valueScore = calculateHorseValueScore(rating, horse.streckning);
      const recommendation = recommendHorse(
        rating,
        horse.streckning,
        race.entries.length
      );
      const poolEdge = calculateHorsePoolEdge(
        rating.estimatedWinProb,
        horse.streckning
      );

      const isBanker = recommendation === "banker";
      const isSkrall = recommendation === "skräll";

      const analysisLines: string[] = [];
      if (horse.postPosition <= 3 && horse.startType === "volt")
        analysisLines.push(`Spår ${horse.postPosition} — bra voltläge.`);
      if (horse.driver.winRate >= 25)
        analysisLines.push(`Toppkusk ${horse.driver.name} (${horse.driver.winRate}% V).`);
      if (horse.recentForm[0] === "1")
        analysisLines.push("Vann senast.");
      if (horse.recentForm.includes("G") || horse.recentForm.includes("U"))
        analysisLines.push("Obs: gallopp/utgång i senaste loppen.");
      if (poolEdge >= 6)
        analysisLines.push(`Understreckad +${poolEdge}pp pool-edge.`);
      if (horse.streckning >= 40)
        analysisLines.push(`Överstreckat (${horse.streckning}%) — låg utdelning.`);

      return {
        ...horse,
        valueScore,
        recommendation,
        isBanker,
        isSkrall,
        analysis: analysisLines.join(" ") || "Normalt spelläge.",
      };
    })
    .sort((a, b) => b.valueScore - a.valueScore);
}

/**
 * Bestämmer om ett lopp är "enkel", "medel" eller "svår"
 * baserat på hur jämnt fältet är.
 */
export function classifyRaceDifficulty(
  race: Race
): "enkel" | "medel" | "svår" {
  const ratings = race.entries.map((h) => rateHorse(h, race).total);
  const max = Math.max(...ratings);
  const second = ratings.filter((r) => r !== max).reduce((a, b) => Math.max(a, b), 0);
  const gap = max - second;

  if (gap >= 15) return "enkel";   // Klar favorit
  if (gap >= 8) return "medel";
  return "svår";                   // Jämnt fält
}

/**
 * Hittar bästa skräll-kandidaten i ett lopp.
 */
export function findTopSkrall(entries: HorseEntry[]): HorseEntry | null {
  const skrällar = entries.filter(
    (h) => h.recommendation === "skräll" && h.streckning <= 10
  );
  if (skrällar.length === 0) return null;
  return skrällar.sort((a, b) => b.valueScore - a.valueScore)[0];
}
