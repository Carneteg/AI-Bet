import type { Metadata } from "next";
import { betHistory, calculatePerformance } from "@/data/betHistory";
import { BetlogTable } from "@/components/BetlogTable";

// STATS-08: SEO metadata
export const metadata: Metadata = {
  title: "Prestationsanalys – Stryktips Analys",
  description:
    "Följ ROI, CLV och vinstfrekvens för dina stryktips- och matchbettingspel. " +
    "Transparent spellogg och statistik för seriösa bettare.",
};

const SIGNIFICANCE_THRESHOLD = 50;

export default function StatsPage() {
  const perf = calculatePerformance(betHistory);
  const settled = betHistory.filter(
    (b) => b.outcome === "win" || b.outcome === "loss"
  );
  const progress = Math.min(
    100,
    Math.round((settled.length / SIGNIFICANCE_THRESHOLD) * 100)
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* STATS-01 + STATS-02: Hero – value prop, context, above-fold CTA */}
      <section className="mb-10" aria-labelledby="stats-heading">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            {/* Context: whose stats, period */}
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">
              Demo-konto · Jan – Apr 2025
            </p>
            <h1
              id="stats-heading"
              className="text-4xl font-extrabold mb-3"
            >
              Prestationsanalys
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
              Spårning av alla spel för det här kontot sedan start. ROI, CLV och
              vinstfrekvens visar om metoden verkligen ger edge — oavsett
              kortsiktiga resultat. En seriös bettare loggar varje spel.
            </p>
          </div>
          {/* STATS-02: Above-fold CTA */}
          <a
            href="/history"
            className="shrink-0 inline-flex items-center gap-2 bg-brand text-white font-semibold rounded-xl px-5 py-3 text-sm hover:bg-brand/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
          >
            + Logga ditt spel
          </a>
        </div>
      </section>

      {/* STATS-04: Sample-size warning with progress indicator */}
      {settled.length < SIGNIFICANCE_THRESHOLD && (
        <section aria-label="Statistisk signifikans" className="mb-8">
          <div className="bg-accent-yellow/5 border border-accent-yellow/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span
                className="text-accent-yellow text-base mt-0.5 shrink-0"
                aria-hidden="true"
              >
                ⚠
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-accent-yellow text-sm mb-1">
                  Låg statistisk signifikans
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">
                  Statistiken baseras på{" "}
                  <strong className="text-accent-yellow">
                    {settled.length} avgjorda spel
                  </strong>
                  . Minst <strong>50–100 spel</strong> krävs för att resultaten
                  ska vara statistiskt tillförlitliga. Håll loggen uppdaterad!
                </p>
                {/* Progress bar toward 50 bets */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 bg-slate-700 rounded-full h-2"
                    role="progressbar"
                    aria-valuenow={settled.length}
                    aria-valuemin={0}
                    aria-valuemax={SIGNIFICANCE_THRESHOLD}
                    aria-label={`${settled.length} av ${SIGNIFICANCE_THRESHOLD} spel loggade`}
                  >
                    <div
                      className="bg-accent-yellow rounded-full h-2 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 shrink-0 tabular-nums">
                    {settled.length} / {SIGNIFICANCE_THRESHOLD} spel
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STATS-03 + STATS-07 + STATS-09: KPI section with clear heading and tooltips */}
      <section aria-labelledby="kpi-heading" className="mb-10">
        <h2
          id="kpi-heading"
          className="text-xs text-slate-500 uppercase tracking-widest mb-4"
        >
          Nyckeltal
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* STATS-09 + STATS-10: ROI with tooltip and consistent kr label */}
          <KpiCard
            label="ROI"
            tooltip="Return on Investment — total vinst delat på total insats, uttryckt i procent."
            value={`${perf.roi > 0 ? "+" : ""}${perf.roi}%`}
            sub={`${perf.totalProfit > 0 ? "+" : ""}${perf.totalProfit.toLocaleString("sv-SE")} kr vinst`}
            color={perf.roi >= 0 ? "text-accent-green" : "text-accent-red"}
          />
          {/* STATS-09 + STATS-10: V/F/P tooltip */}
          <KpiCard
            label="Vinstfrekvens"
            tooltip="Andel vunna spel av alla avgjorda spel. V = Vunna, F = Förlorade, P = Pågående."
            value={`${perf.winRate}%`}
            sub={`${perf.wins} V · ${perf.losses} F · ${perf.pending} P`}
            color="text-brand"
          />
          {/* STATS-09: CLV tooltip */}
          <KpiCard
            label="Snitt-CLV"
            tooltip="Closing Line Value — om dina odds var bättre än stängningsoddsen. Positivt CLV visar edge mot marknaden."
            value={`${perf.avgCLV > 0 ? "+" : ""}${perf.avgCLV}%`}
            sub="Genomsnittlig edge"
            color={perf.avgCLV >= 0 ? "text-accent-green" : "text-accent-red"}
          />
          <KpiCard
            label="Bästa serie"
            tooltip="Längsta vinstsvit i rad. Nuvarande serie räknas från senaste avgjorda spel."
            value={`${perf.bestStreak} V`}
            sub={`Nuvarande: ${perf.currentStreak} V i rad`}
            color="text-accent-yellow"
          />
        </div>
      </section>

      {/* STATS-09: CLV explanation box */}
      <section aria-labelledby="clv-heading" className="mb-10">
        <div className="bg-surface-card border border-brand/20 rounded-2xl p-5">
          <h2
            id="clv-heading"
            className="font-bold text-base mb-2 text-brand"
          >
            Vad är Closing Line Value (CLV)?
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            CLV mäter om dina odds var <em>bättre</em> än stängningsoddsen —
            det vill säga om du identifierade edge <em>innan</em> marknaden
            korrigerade sig. Spelade du 3,50 och oddset stängde på 3,10 hade du{" "}
            <strong className="text-accent-green">+12,9% CLV</strong>. Konsistent
            positiv CLV över 50+ spel är det starkaste beviset på att metoden
            fungerar — oavsett kortsiktiga resultat. Mål: snitt-CLV &gt; +3%.
          </p>
          {/* STATS-07: Use <dl> for key–value pairs */}
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="inline text-slate-500">Ditt snitt-CLV: </dt>
              <dd
                className={`inline font-bold ${
                  perf.avgCLV >= 3
                    ? "text-accent-green"
                    : perf.avgCLV >= 0
                    ? "text-accent-yellow"
                    : "text-accent-red"
                }`}
              >
                {perf.avgCLV > 0 ? "+" : ""}
                {perf.avgCLV}%
              </dd>
            </div>
            <div>
              <dt className="inline text-slate-500">Snitt-odds: </dt>
              <dd className="inline font-bold text-slate-300">{perf.avgOdds}</dd>
            </div>
            <div>
              <dt className="inline text-slate-500">Total insats: </dt>
              <dd className="inline font-bold text-slate-300">
                {perf.totalStaked.toLocaleString("sv-SE")} kr
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* STATS-03: ROI per liga – own section */}
      {Object.keys(perf.byLeague).length > 0 && (
        <section aria-labelledby="league-heading" className="mb-10">
          <h2 id="league-heading" className="text-xl font-bold mb-4">
            ROI per liga
          </h2>
          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
            role="list"
          >
            {Object.entries(perf.byLeague).map(([league, data]) => (
              <div
                key={league}
                className="bg-surface-card border border-slate-700 rounded-xl p-4"
                role="listitem"
              >
                <div className="text-slate-400 text-sm font-medium">
                  {league}
                </div>
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
        </section>
      )}

      {/* STATS-05 + STATS-06 + STATS-07: Spellog as sortable semantic table */}
      <section aria-labelledby="betlog-heading" className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 id="betlog-heading" className="text-xl font-bold">
            Spellog
          </h2>
          <span className="text-xs text-slate-500 tabular-nums">
            {betHistory.length} spel totalt · klicka kolumnrubriker för att sortera
          </span>
        </div>
        {/* STATS-06: overflow-x-auto in BetlogTable handles mobile scroll */}
        <BetlogTable bets={betHistory} />
      </section>

      {/* STATS-02: Bottom CTA */}
      <section aria-labelledby="cta-heading" className="mb-6">
        <div className="bg-surface-card border border-brand/20 rounded-2xl p-6 text-center">
          <h2 id="cta-heading" className="font-bold text-lg mb-2">
            Börja logga dina spel idag
          </h2>
          <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
            Logga varje spel för att bygga din statistik och bevisa din edge.
            Transparent spellog är grunden för seriöst betting.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/history"
              className="inline-flex items-center justify-center gap-2 bg-brand text-white font-semibold rounded-xl px-5 py-3 text-sm hover:bg-brand/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
            >
              + Logga dina spel
            </a>
            {/* STATS-08: Internal link to key flow */}
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-slate-600 text-slate-300 font-semibold rounded-xl px-5 py-3 text-sm hover:border-brand/40 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
            >
              Se aktuell analys
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// STATS-09: KpiCard with tooltip on abbreviation
function KpiCard({
  label,
  tooltip,
  value,
  sub,
  color,
}: {
  label: string;
  tooltip: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-surface-card border border-slate-700 rounded-2xl p-5">
      {/* STATS-07: accessible label with tooltip via title + aria-label */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <span
          title={tooltip}
          aria-label={tooltip}
          role="img"
          className="text-slate-600 hover:text-slate-400 cursor-help text-xs leading-none"
        >
          ⓘ
        </span>
      </div>
      <div className={`text-3xl font-extrabold tabular-nums ${color}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}
