export type PaceStyle = "Frontrunner" | "Stalker" | "Closer";

export interface Horse {
  id: string;
  name: string;
  openingOdds: number;
  currentOdds: number;
  paceStyle: PaceStyle;
  trainer: string;
  hasHiddenForm: boolean;
  trainerClass: "Elite" | "Average" | "Cold";
}

export interface Race {
  id: string;
  track: string;
  distance: string;
  time: string;
  horses: Horse[];
}

export interface RacingScenario {
  title: string;
  targetHorse: string;
  raceId: string;
  description: string;
  type: "Pace Meltdown" | "Insider Drift" | "Hidden Form" | "Trainer Intent";
  edge: "High" | "Medium" | "Extreme";
}
