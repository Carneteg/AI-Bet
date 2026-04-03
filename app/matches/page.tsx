import { matches } from "@/data/matches";
import MatchCard from "@/components/MatchCard";

export default function MatchesPage() {
  const spikar = matches.filter((m) => m.recommendation === "spik");
  const garderingar = matches.filter((m) => m.recommendation === "gardering");
  const skrall = matches.filter((m) => m.recommendation === "skräll");
  const rest = matches.filter((m) => !["spik", "gardering", "skräll"].includes(m.recommendation));

  const sections = [
    { title: "🔒 Spikar", items: spikar },
    { title: "🛡️ Garderingar", items: garderingar },
    { title: "⚡ Skrällvarningar", items: skrall },
    { title: "📊 Övriga matcher", items: rest },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold mb-2">Matchanalys</h1>
        <p className="text-slate-400">
          Alla {matches.length} matcher med value score, xG, streckning-edge och Kelly-rekommendationer.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-8 bg-surface-card border border-slate-700 rounded-2xl p-4 flex flex-wrap gap-6 text-xs text-slate-400">
        <div>
          <span className="text-accent-green font-semibold">+Xpp</span> = streckning-edge (din sannolikhet minus streckad %)
        </div>
        <div>
          <span className="text-slate-300 font-semibold">xG</span> = expected goals (mer prediktivt än faktiska mål)
        </div>
        <div>
          <span className="text-brand font-semibold">Kelly %</span> = rekommenderad insats av bankroll (1/4 Kelly)
        </div>
      </div>

      {sections.map(
        (section) =>
          section.items.length > 0 && (
            <div key={section.title} className="mb-12">
              <h2 className="text-xl font-bold mb-4 text-slate-200">
                {section.title}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((match) => (
                  <MatchCard key={match.id} match={match} expanded />
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}
