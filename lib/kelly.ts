/**
 * Kelly Criterion — optimal insatsstorlek för värdebetting.
 *
 * Kelly-formeln maximerar den geometriska tillväxten av din bankroll
 * på lång sikt. En erfaren bettare använder alltid fraktionellt Kelly
 * (vanligtvis 1/4 till 1/2) för att hantera varians och modelloosäkerhet.
 *
 * För Stryktips (parimutuelpool) gäller en modifierad version av Kelly
 * där utdelningen är okänd på förhand — vi estimerar den från streckningsprocenten.
 */

export interface KellyResult {
  fullKelly: number;      // Ren Kelly-andel av bankroll (kan vara hög, använd med försiktighet)
  fractionalKelly: number; // 1/4 Kelly — rekommenderad i praktiken
  edge: number;           // Procentuellt edge (ditt prob - implied prob)
  expectedValue: number;  // EV per kr insatsat (>1.0 är positivt)
  isValue: boolean;       // True om Kelly > 0 (positivt väntevärde)
  recommendedStakePercent: number; // % av bankroll att satsa
}

/**
 * Klassisk Kelly Criterion för fast odds.
 *
 * K = (b*p - q) / b
 * Där:
 *   b = decimalodds - 1  (netto vinst per kr)
 *   p = din sannolikhetsbedömning (0-1)
 *   q = 1 - p
 *
 * Negativt Kelly = inget värde, satsa ej.
 */
export function calculateKelly(
  decimalOdds: number,
  estimatedProbability: number  // 0-1
): KellyResult {
  const b = decimalOdds - 1;
  const p = estimatedProbability;
  const q = 1 - p;

  const fullKelly = (b * p - q) / b;
  const fractionalKelly = Math.max(0, fullKelly / 4);
  const edge = p - (1 / decimalOdds);
  const expectedValue = decimalOdds * p;

  return {
    fullKelly: Math.max(0, Math.round(fullKelly * 1000) / 1000),
    fractionalKelly: Math.round(fractionalKelly * 1000) / 1000,
    edge: Math.round(edge * 1000) / 10,  // Procent
    expectedValue: Math.round(expectedValue * 100) / 100,
    isValue: fullKelly > 0,
    recommendedStakePercent: Math.round(fractionalKelly * 100 * 10) / 10,
  };
}

/**
 * Kelly för Stryktips / parimutuelpooler.
 *
 * I poolspel är utdelningen proportionell mot (pool / antal vinnande rader).
 * Vi kan estimera utdelningen från streckningsprocenten:
 *   Estimerad odds ≈ (1 / streckning_andel) * (1 - husandel)
 *
 * Husandelen i Stryktips är ca 35% (35% till Svenska Spel, 65% ut i poolen).
 *
 * @param streckning    - Offentlig streckningsprocent (0-100)
 * @param yourProb      - Din sannolikhetsbedömning (0-100)
 * @param poolReturn    - Andel av pool som betalas ut (default 0.65 för Stryktips)
 */
export function calculatePoolKelly(
  streckning: number,
  yourProb: number,
  poolReturn = 0.65
): KellyResult {
  const s = streckning / 100;
  const p = yourProb / 100;

  // Estimera effektiva odds från streckningsprocent
  // Om 20% streckar på "1" får varje korrekt rad ca 1/0.20 = 5x insatsen (minus husandel)
  const estimatedOdds = s > 0 ? poolReturn / s : 1;
  const b = estimatedOdds - 1;
  const q = 1 - p;

  const fullKelly = b > 0 ? (b * p - q) / b : -1;
  const fractionalKelly = Math.max(0, fullKelly / 4);
  const edge = p - s;  // Din sannolikhet minus streckningsprocent
  const expectedValue = estimatedOdds * p;

  return {
    fullKelly: Math.max(0, Math.round(fullKelly * 1000) / 1000),
    fractionalKelly: Math.round(fractionalKelly * 1000) / 1000,
    edge: Math.round(edge * 100 * 10) / 10,
    expectedValue: Math.round(expectedValue * 100) / 100,
    isValue: fullKelly > 0 && p > s,
    recommendedStakePercent: Math.round(fractionalKelly * 100 * 10) / 10,
  };
}

/**
 * Hitta bästa tecknet för Kelly baserat på alla tre utfall.
 * Returnerar det utfall med högst Kelly-fraction och positivt EV.
 */
export function getBestKellySign(
  odds: { home: number; draw: number; away: number },
  probabilities: { home: number; draw: number; away: number }
): { sign: "1" | "X" | "2"; kelly: KellyResult } | null {
  const candidates: Array<{ sign: "1" | "X" | "2"; kelly: KellyResult }> = [
    {
      sign: "1",
      kelly: calculateKelly(odds.home, probabilities.home / 100),
    },
    {
      sign: "X",
      kelly: calculateKelly(odds.draw, probabilities.draw / 100),
    },
    {
      sign: "2",
      kelly: calculateKelly(odds.away, probabilities.away / 100),
    },
  ];

  const positive = candidates.filter((c) => c.kelly.isValue);
  if (positive.length === 0) return null;

  return positive.reduce((best, curr) =>
    curr.kelly.fractionalKelly > best.kelly.fractionalKelly ? curr : best
  );
}

/**
 * Beräknar Kelly för alla tre Stryktips-tecken och returnerar
 * ranking sorterad på pool-EV.
 */
export function getStryktipsKellyRanking(
  streckning: { home: number; draw: number; away: number },
  probabilities: { home: number; draw: number; away: number }
): Array<{ sign: "1" | "X" | "2"; kelly: KellyResult; label: string }> {
  const results = [
    {
      sign: "1" as const,
      kelly: calculatePoolKelly(streckning.home, probabilities.home),
      label: "Hemmaseger",
    },
    {
      sign: "X" as const,
      kelly: calculatePoolKelly(streckning.draw, probabilities.draw),
      label: "Oavgjort",
    },
    {
      sign: "2" as const,
      kelly: calculatePoolKelly(streckning.away, probabilities.away),
      label: "Bortaseger",
    },
  ];

  return results.sort((a, b) => b.kelly.expectedValue - a.kelly.expectedValue);
}

/**
 * Interpreterar Kelly-fraction till en förståelig rekommendation.
 */
export function kellyToStakeLabel(fraction: number): string {
  if (fraction <= 0) return "Satsa ej";
  if (fraction < 0.005) return "Mikrostake (< 0.5%)";
  if (fraction < 0.01) return "Liten stake (< 1%)";
  if (fraction < 0.02) return "Måttlig stake (1-2%)";
  if (fraction < 0.05) return "Medelstor stake (2-5%)";
  return "Stor stake (> 5%)";
}
