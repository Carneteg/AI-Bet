import { betHistory, calculatePerformance, calculateCLV } from "@/data/betHistory";

export default function StatsPage() {
  const perf = calculatePerformance(betHistory);
  const settled = betHistory.filter(
    (b) => b.outcome === "win" || b.outcome === "loss"
  );

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Prestationsanalys</h1>
        <p className="text-slate-400 max-w-2xl">
          Spårning av ROI, CLV och vinstfrekvens. En seriös bettare loggar
          varje spel — det är enda sättet att bevisa att metoden verkligen ger edge.
        </p>
      </div>

      {/* KPI-rad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="ROI"
          value={`${perf.roi > 0 ? "+" : ""}${perf.roi}%`}
          sub={`${perf.totalProfit > 0 ? "+" : ""}${perf.totalProfit} kr vinst`}
          color={perf.roi >= 0 ? "text-accent-green" : "text-accent-red"}
        />
        <KpiCard
          label="Vinstfrekvens"
          value={`${perf.winRate}%`}
          sub={`${perf.wins}V / ${perf.losses}F / ${perf.pending}P`}
          color="text-brand"
        />
        <KpiCard
          label="Avg CLV"
          value={`${perf.avgCLV > 0 ? "+" : ""}${perf.avgCLV}%`}
          sub="Closing Line Value"
          color={perf.avgCLV >= 0 ? "text-accent-green" : "text-accent-red"}
        />
        <KpiCard
          label="Bästa serie"
          value={`${perf.bestStreak}V`}
          sub={`Nuvarande: ${perf.currentStreak}V i rad`}
          color="text-accent-yellow"
        />
      </div>

      {/* CLV-förklaring */}
      <div className="bg-surface-card border border-brand/20 rounded-2xl p-5 mb-8">
        <h2 className="font-bold text-base mb-2 text-brand">
          Vad är Closing Line Value (CLV)?
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          CLV mäter om dina odds var <em>bättre</em> än stängningsoddsen.
          Om du spelar 3.50 och oddset stänger på 3.10 hade du +12.9% CLV —
          du identifierade edge <em>innan</em> marknaden korrigerade sig.
          Konsistent positiv CLV över 50+ spel är det starkaste beviset på
          att din metod verkligen fungerar — oavsett kortsiktiga resultat.
          Målet: snitt-CLV &gt; +3%.
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <div>
            <span className="text-slate-500">Ditt snitt-CLV: </span>
            <span
              className={`font-bold ${
                perf.avgCLV >= 3
                  ? "text-accent-green"
                  : perf.avgCLV >= 0
                  ? "text-accent-yellow"
                  : "text-accent-red"
              }`}
            >
              {perf.avgCLV > 0 ? "+" : ""}
              {perf.avgCLV}%
            </span>
          </div>
          <div>
            <span className="text-slate-500">Snitt-odds: </span>
            <span className="font-bold text-slate-300">{perf.avgOdds}</span>
          </div>
          <div>
            <span className="text-slate-500">Total insats: </span>
            <span className="font-bold text-slate-300">{perf.totalStaked} kr</span>
          </div>
        </div>
      </div>

      {/* Per liga */}
      {Object.keys(perf.byLeague).length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">ROI per liga</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(perf.byLeague).map(([league, data]) => (
              <div
                key={league}
                className="bg-surface-card border border-slate-700 rounded-xl p-4"
              >
                <div className="text-slate-400 text-sm font-medium">{league}</div>
                <div
                  className={`text-xl font-bold mt-1 ${
                    data.roi >= 0 ? "text-accent-green" : "text-accent-red"
                  }`}
                >
                  {data.roi > 0 ? "+" : ""}
                  {data.roi}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {data.bets} spel
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spellog */}
      <div>
        <h2 className="text-xl font-bold mb-4">Spellog</h2>
        <div className="space-y-2">
          {betHistory.map((bet) => {
            const clv = calculateCLV(bet);
            return (
              <div
                key={bet.id}
                className={`bg-surface-card border rounded-xl px-4 py-3 flex flex-wrap items-center gap-4 ${
                  bet.outcome === "win"
                    ? "border-accent-green/20"
                    : bet.outcome === "loss"
                    ? "border-accent-red/20"
                    : "border-slate-700"
                }`}
              >
                <div className="text-xs text-slate-500 w-20">{bet.date}</div>

                <div className="flex-1 min-w-[160px]">
                  <div className="font-semibold text-sm">{bet.homeTeam}</div>
                  <div className="text-xs text-slate-500">{bet.league}</div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      bet.sign === "1"
                        ? "bg-brand/20 text-brand"
                        : bet.sign === "X"
                        ? "bg-slate-700 text-slate-300"
                        : "bg-brand/20 text-brand"
                    }`}
                  >
                    {bet.sign}
                  </span>
                  <span className="text-slate-300 font-semibold">
                    @{bet.yourOdds.toFixed(2)}
                  </span>
                  {clv !== null && (
                    <span
                      className={`text-xs ${
                        clv >= 0 ? "text-accent-green" : "text-accent-red"
                      }`}
                    >
                      CLV {clv > 0 ? "+" : ""}
                      {clv}%
                    </span>
                  )}
                </div>

                <div className="text-sm">
                  <span className="text-slate-500">{bet.stake} kr</span>
                </div>

                <div className="text-sm font-bold">
                  {bet.outcome === "win" ? (
                    <span className="text-accent-green">
                      +{bet.profit} kr
                    </span>
                  ) : bet.outcome === "loss" ? (
                    <span className="text-accent-red">-{bet.stake} kr</span>
                  ) : (
                    <span className="text-slate-500">Pågår</span>
                  )}
                </div>

                <OutcomeBadge outcome={bet.outcome} />
              </div>
            );
          })}
        </div>
      </div>

      {settled.length < 20 && (
        <div className="mt-6 bg-accent-yellow/5 border border-accent-yellow/20 rounded-xl p-4 text-accent-yellow text-sm">
          <strong>Obs:</strong> Statistiken baseras på {settled.length} avgjorda spel.
          Minst 50-100 spel behövs för statistisk signifikans. Håll loggen uppdaterad!
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-surface-card border border-slate-700 rounded-2xl p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === "win")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20 font-semibold">
        Vann
      </span>
    );
  if (outcome === "loss")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/20 font-semibold">
        Förlorad
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600 font-semibold">
      Pågår
    </span>
  );
}
