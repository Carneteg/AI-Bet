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
  const teams = [match.homeTeam, match.awayTeam];

  return (
    <div className="bg-surface-card border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-3 flex flex-wrap items-center gap-4 transition">
      <div className="w-5 text-slate-500 text-sm font-mono">{match.matchNumber}</div>

      <div className="flex-1 min-w-[180px]">
        <div className="font-semibold text-sm">
          {teams[0]}{" "}
          <span className="text-slate-500 font-normal text-xs">vs</span>{" "}
          {teams[1]}
        </div>
        <div className="text-xs text-slate-500">{match.league} · {match.time}</div>
      </div>

      <RecommendationTag recommendation={match.recommendation} />

      <div className="flex gap-2 ml-auto">
        {signs.map((sign) => {
          const selected = selections.includes(sign);
          const recommended = match.recommendedSigns.includes(sign);
          return (
            <button
              key={sign}
              onClick={() => onSelect(sign)}
              className={clsx(
                "w-10 h-10 rounded-lg font-bold text-sm border transition",
                selected
                  ? "bg-brand border-brand text-white shadow-lg shadow-brand/30"
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
