import { Race, RacingScenario, Horse } from "./racingTypes";

export function analyzeRacingCard(races: Race[]): RacingScenario[] {
  const scenarios: RacingScenario[] = [];

  races.forEach(race => {
    // 1. Pace Collapse Analysis
    const frontrunners = race.horses.filter(h => h.paceStyle === "Frontrunner");
    if (frontrunners.length >= 3) {
      // Find the best closer
      const closers = race.horses.filter(h => h.paceStyle === "Closer");
      if (closers.length > 0) {
        // Sort by current odds
        closers.sort((a, b) => a.currentOdds - b.currentOdds);
        const target = closers[0];
        
        scenarios.push({
          title: "Pace Meltdown Expected",
          targetHorse: target.name,
          raceId: race.id,
          description: `With ${frontrunners.length} established frontrunners (${frontrunners.map(f=>f.name).join(', ')}), the early pace will be suicidal. This severely upgrades the closing profile of ${target.name} who will be picking up the pieces late.`,
          type: "Pace Meltdown",
          edge: "High"
        });
      }
    }

    // 2. Insider Drift
    race.horses.forEach(h => {
      const oddsDropRatio = h.openingOdds / h.currentOdds;
      if (oddsDropRatio > 1.8) { // Massive drop
        scenarios.push({
          title: "Massive Insider Plunge",
          targetHorse: h.name,
          raceId: race.id,
          description: `The market has absolutely hammered this horse overnight, dropping from ${h.openingOdds.toFixed(1)} to ${h.currentOdds.toFixed(1)}. This severe line movement indicates highly concentrated, informed money arriving for trainer ${h.trainer}.`,
          type: "Insider Drift",
          edge: "Extreme"
        });
      }
    });

    // 3. Hidden Form Traps
    race.horses.forEach(h => {
      if (h.hasHiddenForm && h.currentOdds >= 8.0) {
        scenarios.push({
          title: "Hidden Form Exploitation",
          targetHorse: h.name,
          raceId: race.id,
          description: `The public is ignoring this runner at ${h.currentOdds.toFixed(1)} due to a poor numerical finish last time out. However, our hidden form metrics flag severe traffic trouble or bad ground in that run. Massive positive regression likely.`,
          type: "Hidden Form",
          edge: "High"
        });
      }
    });

  });

  // Return the top 3 most extreme scenarios (prioritize insider and pace collapses)
  return scenarios.sort((a, b) => {
    if (a.edge === "Extreme") return -1;
    if (b.edge === "Extreme") return 1;
    return 0;
  }).slice(0, 3);
}
