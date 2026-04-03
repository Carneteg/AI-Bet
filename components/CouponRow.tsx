import type { Match, Selection } from "@/data/matches";
import RecommendationTag from "./RecommendationTag";
import clsx from "clsx";

interface Props {
  match: Match;
  selections: Selection[];
  onSelect: (sign: Selection) => void;
}

export default function CouponRow({ match, selections, onSelect }: Props) {
  const signs: Selection[] = ["1", "X", "2"];
  const keys = ["home", "draw", "away"] as const;

  return (
    <div className="bg-surface-card border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-3 flex flex-wrap items-center gap-4 transition">
      <div className="w-5 text-slate-500 text-sm font-mono">{match.matchNumber}</div>

      <div className="flex-1 min-w-[160px]">
        <div className="font-semibold text-sm">
          {match.homeTeam}{" "}
          <span className="text-slate-500 font-normal text-xs">vs</span>{" "}
          {match.awayTeam}
        </div>
        <div className="text-xs text-slate-500">{match.league} · {match.time}</div>
      </div>

      <RecommendationTag recommendation={match.recommendation} />

      {/* Streckning-visning: snabb pool-edge indikator */}
      <div className="hidden sm:flex gap-3 text-xs text-slate-500">
        {signs.map((sign, i) => {
          const key = keys[i];
          const streckEdge = match.probabilities[key] - match.streckning[key];
          return (
            <div key={sign} className="text-center">
              <div className="text-slate-600">{sign}</div>
              <div className="text-slate-400">{match.streckning[key]}%</div>
              <div
                className={`font-semibold text-xs ${
                  streckEdge >= 5
                    ? "text-accent-green"
                    : streckEdge <= -6
                    ? "text-accent-red"
                    : "text-slate-600"
                }`}
              >
                {streckEdge > 0 ? "+" : ""}
                {streckEdge.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 ml-auto">
        {signs.map((sign, i) => {
          const selected = selections.includes(sign);
          const recommended = match.recommendedSigns.includes(sign);
          const key = keys[i];
          const streckEdge = match.probabilities[key] - match.streckning[key];
          const hasPoolValue = streckEdge >= 5;
          return (
            <button
              key={sign}
              onClick={() => onSelect(sign)}
              title={`Streckning: ${match.streckning[key]}% | Edge: ${streckEdge > 0 ? "+" : ""}${streckEdge.toFixed(0)}pp`}
              className={clsx(
                "w-10 h-10 rounded-lg font-bold text-sm border transition",
                selected
                  ? "bg-brand border-brand text-white shadow-lg shadow-brand/30"
                  : recommended && hasPoolValue
                  ? "border-accent-green/50 text-accent-green bg-accent-green/5 hover:bg-accent-green/15"
                  : recommended
                  ? "border-brand/40 text-brand bg-brand/5 hover:bg-brand/15"
                  : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
              )}
            >
              {sign}
            </button>
          );
        })}
      </div>
    </div>
  );
}
