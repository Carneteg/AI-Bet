import { getV75Data } from "@/data/v75Data";
import type { HorseEntry, Race } from "@/data/horseTypes";

export const revalidate = 600; // Uppdatera var 10:e minut

export default async function HorsePage() {
  const coupon = await getV75Data();
  const bankers = coupon.races.flatMap((r) =>
    r.entries.filter((h) => h.recommendation === "banker")
  );
  const skrällar = coupon.races.flatMap((r) =>
    r.entries.filter((h) => h.recommendation === "skräll")
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-4xl font-extrabold">V75 Analys</h1>
          <span className="text-xs px-3 py-1 rounded-full bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow font-semibold">
            🐎 {coupon.track} · {coupon.raceDay}
          </span>
        </div>
        <p className="text-slate-400 max-w-2xl">
          Poisson-baserad formanalys, kusk-statistik och streckning-edge
          identifierar bankare och skrällar i varje lopp.
        </p>
      </div>

      {/* KPI-strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-surface-card border border-slate-700 rounded-2xl p-5 text-center">
          <div className="text-3xl font-extrabold text-brand mb-1">
            {coupon.races.length}
          </div>
          <div className="text-xs text-slate-500">lopp analyserade</div>
        </div>
        <div className="bg-surface-card border border-slate-700 rounded-2xl p-5 text-center">
          <div className="text-3xl font-extrabold text-accent-green mb-1">
            {bankers.length}
          </div>
          <div className="text-xs text-slate-500">bankare</div>
        </div>
        <div className="bg-surface-card border border-slate-700 rounded-2xl p-5 text-center">
          <div className="text-3xl font-extrabold text-accent-yellow mb-1">
            {skrällar.length}
          </div>
          <div className="text-xs text-slate-500">skräll-kandidater</div>
        </div>
        <div className="bg-surface-card border border-slate-700 rounded-2xl p-5 text-center">
          <div className="text-3xl font-extrabold text-brand mb-1">
            {coupon.estimatedCost.toLocaleString("sv-SE")} kr
          </div>
          <div className="text-xs text-slate-500">estimerad kupongkostnad</div>
        </div>
      </div>

      {/* Bankare & skrällar sammanfattning */}
      {(bankers.length > 0 || skrällar.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {bankers.length > 0 && (
            <div className="bg-surface-card border border-accent-green/30 rounded-2xl p-5">
              <h2 className="font-bold text-accent-green mb-3">
                🔒 Bankare
              </h2>
              <div className="space-y-2">
                {bankers.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-slate-200">
                        {h.number}. {h.name}
                      </span>
                      <span className="text-slate-500 ml-2 text-xs">
                        {h.driver.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">
                        {h.streckning}% streckad
                      </span>
                      <ValuePill score={h.valueScore} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {skrällar.length > 0 && (
            <div className="bg-surface-card border border-accent-yellow/30 rounded-2xl p-5">
              <h2 className="font-bold text-accent-yellow mb-3">
                ⚡ Skräll-kandidater
              </h2>
              <div className="space-y-2">
                {skrällar.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-slate-200">
                        {h.number}. {h.name}
                      </span>
                      <span className="text-slate-500 ml-2 text-xs">
                        {h.driver.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent-yellow text-xs font-semibold">
                        Odds ~{h.estimatedOdds}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {h.streckning}% streck
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lopp för lopp */}
      <div className="space-y-8">
        {coupon.races.map((race) => (
          <RaceCard key={race.id} race={race} />
        ))}
      </div>
    </div>
  );
}

function RaceCard({ race }: { race: Race }) {
  const sorted = [...race.entries].sort((a, b) => b.valueScore - a.valueScore);

  return (
    <div className="bg-surface-card border border-slate-700 rounded-2xl overflow-hidden">
      {/* Loppheader */}
      <div className="p-5 border-b border-slate-700 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            Lopp {race.raceNumber} · {race.track} · {race.time} · {race.distance}m ·{" "}
            {race.startType === "volt" ? "Voltstart" : "Autostart"}
          </div>
          <div className="font-bold text-lg">
            {race.raceType} — {race.purse.toLocaleString("sv-SE")} kr
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DifficultyBadge difficulty={race.difficulty} />
          {race.isGarderable && (
            <span className="text-xs px-2 py-1 rounded-full bg-brand/10 border border-brand/30 text-brand font-semibold">
              🛡️ Gardera
            </span>
          )}
          {race.recommendedBanker && (
            <span className="text-xs px-2 py-1 rounded-full bg-accent-green/10 border border-accent-green/30 text-accent-green font-semibold">
              🔒 Bankare: {race.recommendedBanker}
            </span>
          )}
        </div>
      </div>

      {/* Hästar */}
      <div className="divide-y divide-slate-700/50">
        {sorted.map((horse) => (
          <HorseRow key={horse.id} horse={horse} />
        ))}
      </div>
    </div>
  );
}

function HorseRow({ horse }: { horse: HorseEntry }) {
  const recColors = {
    banker: "border-l-accent-green text-accent-green",
    skräll: "border-l-accent-yellow text-accent-yellow",
    gardering: "border-l-brand text-brand",
    spel: "border-l-slate-500 text-slate-400",
    stryk: "border-l-slate-700 text-slate-600",
  };
  const borderColor = recColors[horse.recommendation] ?? recColors.spel;
  const isStryk = horse.recommendation === "stryk";

  return (
    <div
      className={`px-5 py-3 flex flex-wrap items-center gap-3 border-l-4 ${borderColor} ${
        isStryk ? "opacity-40" : ""
      }`}
    >
      {/* Nummer + namn */}
      <div className="w-6 text-slate-500 font-mono text-sm">{horse.number}</div>
      <div className="flex-1 min-w-[160px]">
        <div className="font-semibold text-sm">
          {horse.name}{" "}
          <span className="text-slate-500 font-normal text-xs">
            {horse.age}år {horse.sex}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          {horse.driver.name}{" "}
          <span className="text-slate-600">
            ({horse.driver.winRate}% V) · Tr: {horse.trainer.name}
            {horse.trainer.hotStreak && (
              <span className="text-accent-green ml-1">↑ varm</span>
            )}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="flex gap-1">
        {horse.recentForm.map((f, i) => (
          <span
            key={i}
            className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
              f === "1"
                ? "bg-accent-green/20 text-accent-green"
                : f === "2" || f === "3"
                ? "bg-brand/20 text-brand"
                : f === "G" || f === "U"
                ? "bg-accent-red/20 text-accent-red"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Spår + km-tid */}
      <div className="text-xs text-slate-400 text-center">
        <div className="text-slate-300 font-semibold">Spår {horse.postPosition}</div>
        <div>{horse.bestKmTime}</div>
      </div>

      {/* Streckning + edge */}
      <div className="text-xs text-center">
        <div className="text-slate-400">{horse.streckning}% streck</div>
        <div className="font-semibold text-slate-300">
          ~{horse.estimatedOdds}x odds
        </div>
      </div>

      {/* Value score */}
      <ValuePill score={horse.valueScore} />

      {/* Rekommendation */}
      <RecBadge recommendation={horse.recommendation} />

      {/* Analys */}
      {horse.analysis && !isStryk && (
        <div className="w-full text-xs text-slate-500 mt-1 pl-9">
          {horse.analysis}
        </div>
      )}
    </div>
  );
}

function ValuePill({ score }: { score: number }) {
  const color =
    score >= 75
      ? "bg-accent-green/20 text-accent-green border-accent-green/30"
      : score >= 60
      ? "bg-brand/20 text-brand border-brand/30"
      : score >= 45
      ? "bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30"
      : "bg-slate-700 text-slate-500 border-slate-600";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${color}`}>
      {score}
    </span>
  );
}

function RecBadge({
  recommendation,
}: {
  recommendation: HorseEntry["recommendation"];
}) {
  const map = {
    banker: { label: "🔒 Bankare", cls: "bg-accent-green/10 text-accent-green border-accent-green/30" },
    skräll: { label: "⚡ Skräll", cls: "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30" },
    gardering: { label: "🛡️ Gardera", cls: "bg-brand/10 text-brand border-brand/30" },
    spel: { label: "✓ Spel", cls: "bg-slate-700 text-slate-300 border-slate-600" },
    stryk: { label: "✕ Stryk", cls: "bg-slate-800 text-slate-600 border-slate-700" },
  };
  const { label, cls } = map[recommendation] ?? map.spel;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Race["difficulty"] }) {
  const map = {
    enkel: { label: "Enkel", cls: "bg-accent-green/10 text-accent-green border-accent-green/30" },
    medel: { label: "Medel", cls: "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30" },
    svår: { label: "Svår", cls: "bg-accent-red/10 text-accent-red border-accent-red/30" },
  };
  const { label, cls } = map[difficulty];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cls}`}>
      {label}
    </span>
  );
}
