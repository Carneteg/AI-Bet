import type { Match } from "@/data/matches";
import ValueBadge from "./ValueBadge";
import RecommendationTag from "./RecommendationTag";
import { getValueBreakdown } from "@/lib/valueScore";
import { getBestKellySign } from "@/lib/kelly";
import { classifyStreckningProfile } from "@/lib/stryktipsStrategy";

interface Props {
  match: Match;
  expanded?: boolean;
}

export default function MatchCard({ match, expanded = false }: Props) {
  const breakdown = getValueBreakdown(match);
  const kellyResult = getBestKellySign(match.odds, match.probabilities);
  const streckProfile = classifyStreckningProfile(match);

  return (
    <div className="bg-surface-card border border-slate-700 hover:border-brand/40 rounded-2xl p-5 transition group">
      {/* Header */}
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

      {/* Odds + sannolikheter + streckning */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(["home", "draw", "away"] as const).map((key, i) => {
          const sign = i === 0 ? "1" : i === 1 ? "X" : "2";
          const streckEdge = match.probabilities[key] - match.streckning[key];
          const isValueSign = streckEdge >= 4;
          const isOverstreckad = streckEdge <= -6;
          return (
            <div
              key={key}
              className={`rounded-xl p-2 text-center border transition ${
                match.recommendedSigns.includes(sign as "1" | "X" | "2")
                  ? "border-brand/60 bg-brand/10"
                  : isValueSign
                  ? "border-accent-green/40 bg-accent-green/5"
                  : isOverstreckad
                  ? "border-accent-red/30 bg-accent-red/5"
                  : "border-slate-700 bg-surface"
              }`}
            >
              <div className="text-xs text-slate-500 mb-0.5">{sign}</div>
              <div className="font-bold text-sm">
                {(match.odds[key] ?? 0).toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">
                {match.probabilities[key]}%
                <span className="text-slate-600"> san.</span>
              </div>
              <div className="text-xs text-slate-500">
                {match.streckning[key]}%
                <span className="text-slate-600"> streck</span>
              </div>
              {/* Streckning-edge */}
              <div
                className={`text-xs font-semibold mt-0.5 ${
                  streckEdge > 0 ? "text-accent-green" : "text-accent-red"
                }`}
              >
                {streckEdge > 0 ? "+" : ""}
                {(streckEdge ?? 0).toFixed(0)}pp
              </div>
            </div>
          );
        })}
      </div>

      {/* xG-rad */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
        <span>
          xG: <span className="text-slate-300 font-semibold">{(match.xg?.home ?? 0).toFixed(2)}</span>
          <span className="mx-1 text-slate-600">—</span>
          <span className="text-slate-300 font-semibold">{(match.xg?.away ?? 0).toFixed(2)}</span>
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            streckProfile.type === "skräll_möjlighet"
              ? "bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30"
              : streckProfile.type === "overstreckad_favorit"
              ? "bg-accent-red/10 text-accent-red border border-accent-red/30"
              : streckProfile.type === "klar_favorit"
              ? "bg-accent-green/10 text-accent-green border border-accent-green/30"
              : "bg-slate-700/50 text-slate-400 border border-slate-600"
          }`}
        >
          {streckProfile.type === "skräll_möjlighet"
            ? "⚡ Skräll"
            : streckProfile.type === "overstreckad_favorit"
            ? "⚠ Överstreckat"
            : streckProfile.type === "klar_favorit"
            ? "✓ Klar favorit"
            : "= Jämn"}
        </span>
      </div>

      {/* Value badge */}
      <ValueBadge score={match.valueScore} />

      {/* Kelly-rekommendation */}
      {kellyResult && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-slate-500">Kelly:</span>
          <span className="text-brand font-semibold">
            {kellyResult.sign}
          </span>
          <span className="text-accent-green font-semibold">
            {kellyResult.kelly.recommendedStakePercent}% av bankroll
          </span>
          <span className="text-slate-600">
            (EV {(kellyResult.kelly.expectedValue ?? 0).toFixed(2)}x)
          </span>
        </div>
      )}

      {expanded && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 w-20">{match.homeTeam}</span>
            <FormDots form={match.homeForm} />
            <span className="text-slate-600 ml-1">
              Motivation {match.motivationHome}/5
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 w-20">{match.awayTeam}</span>
            <FormDots form={match.awayForm} />
            <span className="text-slate-600 ml-1">
              Motivation {match.motivationAway}/5
            </span>
          </div>

          {/* Value breakdown */}
          <div className="flex gap-4 text-xs pt-1">
            <div>
              <span className="text-slate-500">Odds-edge: </span>
              <span
                className={
                  breakdown.oddsEdge >= 0
                    ? "text-accent-green font-semibold"
                    : "text-accent-red font-semibold"
                }
              >
                {breakdown.oddsEdge > 0 ? "+" : ""}
                {breakdown.oddsEdge}pp
              </span>
            </div>
            <div>
              <span className="text-slate-500">Streckning-edge: </span>
              <span
                className={
                  breakdown.streckningEdge >= 0
                    ? "text-accent-green font-semibold"
                    : "text-accent-red font-semibold"
                }
              >
                {breakdown.streckningEdge > 0 ? "+" : ""}
                {breakdown.streckningEdge}pp
              </span>
            </div>
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
      {form.split("").map((result, i) => (
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
