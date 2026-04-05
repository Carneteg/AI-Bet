import { fetchLiveMatches } from "@/lib/footballData";
import { matches as fallbackMatches } from "@/data/matches";
import type { Match } from "@/data/matches";
import MatchCard from "@/components/MatchCard";

export const revalidate = 300; // Uppdatera var 5:e minut

async function getMatches(): Promise<{ matches: Match[]; source: "live" | "fallback" }> {
  const live = await fetchLiveMatches(true);
  if (live && live.length > 0) return { matches: live, source: "live" };
  return { matches: fallbackMatches, source: "fallback" };
}

export default async function MatchesPage() {
  const { matches, source } = await getMatches();

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const spikar = matches.filter((m) => m.recommendation === "spik");
  const garderingar = matches.filter((m) => m.recommendation === "gardering");
  const skrall = matches.filter((m) => m.recommendation === "skräll");
  const rest = matches.filter(
    (m) => !["spik", "gardering", "skräll"].includes(m.recommendation)
  );

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
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-slate-400">
            {matches.length} matcher · {today} – {tomorrow}
          </p>
          {source === "live" ? (
            <span className="text-xs px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/30 text-accent-green font-semibold">
              ● Live data
            </span>
          ) : (
            <span className="text-xs px-3 py-1 rounded-full bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow font-semibold">
              ⚠ Exempel-data — lägg till FOOTBALL_DATA_API_KEY för live
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-8 bg-surface-card border border-slate-700 rounded-2xl p-4 flex flex-wrap gap-6 text-xs text-slate-400">
        <div>
          <span className="text-accent-green font-semibold">+Xpp</span>{" "}
          = streckning-edge (din sannolikhet minus streckad %)
        </div>
        <div>
          <span className="text-slate-300 font-semibold">xG</span>{" "}
          = expected goals (mer prediktivt än faktiska mål)
        </div>
        <div>
          <span className="text-brand font-semibold">Kelly %</span>{" "}
          = rekommenderad insats av bankroll (1/4 Kelly)
        </div>
      </div>

      {source === "fallback" && (
        <div className="mb-8 bg-surface-card border border-accent-yellow/20 rounded-2xl p-5">
          <h3 className="font-bold text-accent-yellow mb-2">
            Aktivera live-matcher
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            För att visa dagens och morgondagens riktiga matcher, lägg till{" "}
            <code className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-200">
              FOOTBALL_DATA_API_KEY
            </code>{" "}
            i Vercel → Settings → Environment Variables.
            <br />
            Registrera gratis på{" "}
            <span className="text-brand">football-data.org/client/register</span>{" "}
            — tar 30 sekunder.
          </p>
        </div>
      )}

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
