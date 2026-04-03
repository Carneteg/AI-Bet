import Link from "next/link";
import { matches } from "@/data/matches";
import MatchCard from "@/components/MatchCard";

export default function HomePage() {
  const topMatches = matches.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16 px-4">
        <div className="inline-block bg-brand/10 border border-brand/30 rounded-full px-4 py-1 text-brand text-sm font-medium mb-6">
          Omgång 12 · 2025
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
          Spela smartare med{" "}
          <span className="text-gradient">AI-driven analys</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
          Djupanalys av varje match i Stryktips med value scores,
          spikar och skrällvarningar baserade på statistik och form.
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
            Bygg kupong
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Matcher analyserade", value: matches.length },
          { label: "Spikar", value: matches.filter((m) => m.recommendation === "spik").length },
          { label: "Garderingar", value: matches.filter((m) => m.recommendation === "gardering").length },
          { label: "Skrällvarningar", value: matches.filter((m) => m.recommendation === "skräll").length },
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

      {/* Toppval */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Veckans toppval</h2>
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
    </div>
  );
}
