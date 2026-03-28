import type { Match } from "@/data/matches";
import ValueBadge from "./ValueBadge";
import RecommendationTag from "./RecommendationTag";

interface Props {
  match: Match;
  expanded?: boolean;
}

export default function MatchCard({ match, expanded = false }: Props) {
  return (
    <div className="bg-surface-card border border-slate-700 hover:border-brand/40 rounded-2xl p-5 transition group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Match {match.matchNumber} · {match.league}
          </div>
          <div className="font-bold text-base leading-tight">
            {match.homeTeam}
            <span className="text-slate-500 font-normal"> vs </span>
            {match.awayTeam}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {match.date} · {match.time}
          </div>
        </div>
        <RecommendationTag recommendation={match.recommendation} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {(["home", "draw", "away"] as const).map((key, i) => (
          <div
            key={key}
            className={`rounded-xl p-2 text-center border transition ${
              match.recommendedSigns.includes(i === 0 ? "1" : i === 1 ? "X" : "2")
                ? "border-brand/60 bg-brand/10"
                : "border-slate-700 bg-surface"
            }`}
          >
            <div className="text-xs text-slate-500 mb-0.5">
              {i === 0 ? "1" : i === 1 ? "X" : "2"}
            </div>
            <div className="font-bold text-sm">
              {match.odds[key].toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">
              {match.probabilities[key]}%
            </div>
          </div>
        ))}
      </div>

      <ValueBadge score={match.valueScore} />

      {expanded && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 w-20">{match.homeTeam}</span>
            <FormDots form={match.homeForm} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 w-20">{match.awayTeam}</span>
            <FormDots form={match.awayForm} />
          </div>
          <p className="text-slate-400 text-xs mt-3 leading-relaxed border-t border-slate-700 pt-3">
            {match.analysis}
          </p>
        </div>
      )}
    </div>
  );
}

function FormDots({ form }: { form: string }) {
  return (
    <div className="flex gap-1">
      {form.split(" ").map((result, i) => (
        <span
          key={i}
          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
            result === "V"
              ? "bg-accent-green/20 text-accent-green"
              : result === "F"
              ? "bg-accent-red/20 text-accent-red"
              : "bg-slate-700 text-slate-400"
          }`}
        >
          {result}
        </span>
      ))}
    </div>
  );
}
