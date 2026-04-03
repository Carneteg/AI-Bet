/**
 * Häst- och travbettingtyper för V75, V86, V64, V4/V5.
 *
 * Svenska ATG-spel är parimutuella pooler precis som Stryktips —
 * streckning-edge mot publiken är nyckeln till vinst.
 *
 * Nyckelinsikter för vinnande travbetting:
 * 1. Post position (spår) — inre spår (1-4) har stor fördel i volt-start
 * 2. Förare/kusks statistik — toppkuskar vinner oproportionerligt mycket
 * 3. Formkurva — senaste 5 loppen viktigare än historik
 * 4. Miljonskrällar — hitta 10-20% hästar som publiken strecknar till 2-5%
 * 5. Bankare vs gardering — balansera säkra banker mot skrällar
 */

export type RaceType = "V75" | "V86" | "V64" | "V4" | "V5" | "Trio" | "GS75";
export type StartType = "volt" | "auto"; // voltstart vs autostart
export type HorseForm = "1" | "2" | "3" | "4" | "5" | "6" | "U" | "G" | "D" | "0";
// 1-6 = placering, U = utgånget, G = gallopperat, D = diskad, 0 = ej startat

export interface Driver {
  name: string;
  winRate: number;        // Vinstprocent denna säsong (0-100)
  placeRate: number;      // Placeringsprocent (top 3) denna säsong
  v75WinRate?: number;    // Specifik V75-statistik
}

export interface Trainer {
  name: string;
  winRate: number;
  hotStreak: boolean;     // Tränarens stall i bra form senaste 2 veckorna
}

export interface HorseEntry {
  id: number;
  number: number;         // Startnummer
  name: string;
  age: number;
  sex: "sto" | "valack" | "hingst";
  driver: Driver;
  trainer: Trainer;
  postPosition: number;   // Spår (1 = innerst)
  startType: StartType;
  distance: number;       // Loppets distans i meter
  recentForm: HorseForm[]; // Senaste 5 lopp (senast först)
  bestKmTime: string;     // Bästa kilometertid t.ex. "1.12,5"
  kmTimeValue: number;    // Numeriskt värde (lägre = snabbare), t.ex. 72.5
  earnings: number;       // Säsongsintäkter i kr
  shoeChange?: string;    // Skobyten (påverkar prestanda)
  scratchRisk: number;    // Risk för utgång 0-10

  // Pool-data
  streckning: number;     // Streckningsprocent (0-100)
  estimatedOdds: number;  // Estimerade odds baserat på streckning

  // Analys
  valueScore: number;     // 0-100 värde-score
  isBanker: boolean;      // Rekommenderad bankare
  isSkrall: boolean;      // Skräll-kandidat
  recommendation: "banker" | "spel" | "skräll" | "gardering" | "stryk";
  analysis: string;
}

export interface Race {
  id: number;
  raceNumber: number;     // Lopps-nr i omgången (1-7 för V75)
  track: string;          // Bana (Solvalla, Åby, Jägersro, etc.)
  raceType: RaceType;
  date: string;
  time: string;
  distance: number;
  startType: StartType;
  purse: number;          // Prispengar i kr
  entries: HorseEntry[];

  // Strategi
  recommendedBanker?: number;   // Startnummer för rekommenderad bankare
  isGarderable: boolean;        // Ska loppet garderas?
  difficulty: "enkel" | "medel" | "svår";
  topSkrall?: HorseEntry;
}

export interface V75Coupon {
  raceDay: string;
  track: string;
  races: Race[];
  totalRows: number;
  estimatedCost: number;
  poolSize?: number;           // Estimerad poolstorlek i kr
  expectedFirstPrize?: number; // Estimerat förstapris
}
