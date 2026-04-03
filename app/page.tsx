import Link from "next/link";
import { matches } from "@/data/matches";
import MatchCard from "@/components/MatchCard";
import { buildCouponStrategy } from "@/lib/stryktipsStrategy";

export default function HomePage() {
  const strategy = buildCouponStrategy(matches);

  // Toppval: spikar och skrällar med högst value score
  const spikar = matches.filter((m) => m.recommendation === "spik");
  const skrällar = matches.filter((m) => m.recommendation === "skräll");
  const garderingar = matches.filter((m) => m.recommendation === "gardering");

  // Topp 3 baserat på value score
  const topMatches = [...matches]
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16 px-4">
        <div className="inline-block bg-brand/10 border border-brand/30 rounded-full px-4 py-1 text-brand text-sm font-medium mb-6">
          Omgång 14 · 2025 · Uppdaterad med xG + Kelly
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
          Vinn på{" "}
          <span className="text-gradient">streckning-edge</span>
          {" "}— inte tur
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
          Poisson-modell, Kelly Criterion och streckning-analys identifierar
          matcher där publiken har fel. Det är där pengarna tjänas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/matches"
            className="bg-brand hover:bg-brand-dark transition px-8 py-3 rounded-xl font-semibold text-white shadow-lg shadow-brand/25"
          >
            Se alla matcher →
          </Link>
          <Link
            href="/coupon"
            className="bg-surface-card border border-slate-600 hover:border-brand/50 transition px-8 py-3 rounded-xl font-semibold text-slate-200"
          >
            Bygg AI-kupong
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Matcher analyserade", value: String(matches.length) },
          { label: "Spikar", value: String(spikar.length) },
          { label: "Garderingar", value: String(garderingar.length) },
          { label: "Skrällkandidater", value: String(skrällar.length) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-card border border-slate-700 rounded-2xl p-6 text-center"
          >
            <div className="text-3xl font-extrabold text-brand mb-1">
              {stat.value}
            </div>
            <div className="text-slate-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Kupongstrategi-sammanfattning */}
      <section className="mb-12 bg-surface-card border border-brand/20 rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Veckans kupongstrategi</h2>
            <p className="text-slate-400 text-sm">
              AI-optimerad för maximal pool-edge mot streckningsprocenten.
            </p>
          </div>
          <Link
            href="/coupon"
            className="bg-brand/20 hover:bg-brand/30 border border-brand/40 text-brand transition px-5 py-2 rounded-xl text-sm font-semibold"
          >
            Bygg kupong →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-brand">
              {strategy.totalRows}
            </div>
            <div className="text-xs text-slate-500">rekommenderade rader</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-extrabold ${
                strategy.confidenceScore >= 70
                  ? "text-accent-green"
                  : "text-accent-yellow"
              }`}
            >
              {strategy.confidenceScore}/100
            </div>
            <div className="text-xs text-slate-500">konfidenspoäng</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-accent-yellow">
              {strategy.topSkrall.length}
            </div>
            <div className="text-xs text-slate-500">skräll-kandidater</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-accent-green">
              {strategy.topSpikar.length}
            </div>
            <div className="text-xs text-slate-500">säkra spikar</div>
          </div>
        </div>
      </section>

      {/* Topp value-matcher */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Högst value score</h2>
          <Link
            href="/matches"
            className="text-brand hover:underline text-sm font-medium"
          >
            Visa alla →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>

      {/* Edu-sektion om Stryktips-edge */}
      <section className="mt-16 border-t border-slate-700/50 pt-12 grid md:grid-cols-3 gap-6">
        <div className="bg-surface-card border border-slate-700 rounded-2xl p-5">
          <div className="text-2xl mb-3">📊</div>
          <h3 className="font-bold mb-2">Poisson-modell</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Dixon-Coles justerad Poisson-fördelning beräknar matchsannolikheter
            från attack/defense-ratings och xG-statistik. Mer träffsäker än
            råa vinstfrekvenser.
          </p>
        </div>
        <div className="bg-surface-card border border-brand/20 rounded-2xl p-5">
          <div className="text-2xl mb-3">🎯</div>
          <h3 className="font-bold mb-2">Streckning-edge</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            I Stryktips tävlar du mot andra spelare — inte bookmaker.
            Nyckeln är att hitta matcher där streckningsprocenten
            kraftigt avviker från verklig sannolikhet.
          </p>
        </div>
        <div className="bg-surface-card border border-slate-700 rounded-2xl p-5">
          <div className="text-2xl mb-3">💰</div>
          <h3 className="font-bold mb-2">Kelly Criterion</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Optimal insatsstorlek (1/4 Kelly) maximerar bankrollstillväxt
            på lång sikt. CLV-spårning bevisar om din metod verkligen ger edge.
          </p>
        </div>
      </section>
    </div>
  );
}
