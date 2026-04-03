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
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Matchanalys</h1>
        <p className="text-slate-400">
          Alla {matches.length} matcher med value score, odds och rekommendation.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          Inga matcher tillgängliga just nu.
        </div>
      ) : (
        sections.map(
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
        )
      )}
    </div>
  );
}
