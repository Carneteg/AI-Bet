import { Race } from "../lib/racingTypes";

export const mockRaces: Race[] = [
  {
    id: "race_ascot_1",
    track: "Ascot",
    distance: "1m 2f",
    time: "14:30",
    horses: [
      { id: "h1", name: "Speed Demon", openingOdds: 2.5, currentOdds: 2.2, paceStyle: "Frontrunner", trainer: "J. Gosden", hasHiddenForm: false, trainerClass: "Elite" },
      { id: "h2", name: "Pace Presser", openingOdds: 6.0, currentOdds: 6.5, paceStyle: "Frontrunner", trainer: "A. Balding", hasHiddenForm: false, trainerClass: "Average" },
      { id: "h3", name: "Front Attack", openingOdds: 7.0, currentOdds: 7.5, paceStyle: "Frontrunner", trainer: "C. Appleby", hasHiddenForm: false, trainerClass: "Average" },
      { id: "h4", name: "Late Charge", openingOdds: 12.0, currentOdds: 15.0, paceStyle: "Closer", trainer: "W. Haggas", hasHiddenForm: true, trainerClass: "Elite" }, // Massive closer setup due to 3 frontrunners + Hidden Form
      { id: "h5", name: "Midfield General", openingOdds: 8.0, currentOdds: 8.0, paceStyle: "Stalker", trainer: "R. Beckett", hasHiddenForm: false, trainerClass: "Average" }
    ]
  },
  {
    id: "race_cheltenham_2",
    track: "Cheltenham",
    distance: "2m",
    time: "15:15",
    horses: [
      { id: "h6", name: "Public Hero", openingOdds: 3.0, currentOdds: 3.5, paceStyle: "Stalker", trainer: "P. Nicholls", hasHiddenForm: false, trainerClass: "Elite" },
      { id: "h7", name: "Shadow Move", openingOdds: 18.0, currentOdds: 6.5, paceStyle: "Closer", trainer: "W. Mullins", hasHiddenForm: false, trainerClass: "Elite" }, // Massive Insider Plunge + Elite Trainer
      { id: "h8", name: "Steady Pace", openingOdds: 5.0, currentOdds: 5.5, paceStyle: "Frontrunner", trainer: "N. Henderson", hasHiddenForm: false, trainerClass: "Average" }
    ]
  },
  {
    id: "race_kempton_3",
    track: "Kempton",
    distance: "7f",
    time: "18:45",
    horses: [
      { id: "h9", name: "Favored Son", openingOdds: 2.0, currentOdds: 2.0, paceStyle: "Frontrunner", trainer: "C. Appleby", hasHiddenForm: false, trainerClass: "Elite" },
      { id: "h10", name: "Traffic Trouble", openingOdds: 9.0, currentOdds: 11.0, paceStyle: "Closer", trainer: "R. Varian", hasHiddenForm: true, trainerClass: "Average" }, // Hidden form drifting
      { id: "h11", name: "Average Joe", openingOdds: 15.0, currentOdds: 15.0, paceStyle: "Stalker", trainer: "J. O'Brien", hasHiddenForm: false, trainerClass: "Average" }
    ]
  }
];
