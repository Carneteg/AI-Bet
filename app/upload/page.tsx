"use client";

import { useState, useCallback } from "react";
import MatchImageUpload from "@/components/MatchImageUpload";
import type { AnalyzedMatchResult } from "@/components/MatchImageUpload";

export default function UploadPage() {
  const [results, setResults] = useState<AnalyzedMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback((data: AnalyzedMatchResult[]) => {
    setResults(data);
    setError(null);
  }, []);

  const handleError = useCallback((msg: string) => {
    setError(msg);
    setResults([]);
  }, []);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Ladda upp matchfoto</h1>
        <p className="text-slate-400 max-w-2xl">
          Ta ett foto på en Stryktipskupong, oddstavla eller matchprogram. AI:n
          läser av matcher, odds och streckprocent och genererar en värdering direkt.
        </p>
      </div>

      <MatchImageUpload
        onAnalysis={handleAnalysis}
        onError={handleError}
        setIsLoading={setIsLoading}
        isLoading={isLoading}
      />

      {error && (
        <div className="mt-6 bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-accent-red text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold mb-6">
            Analysresultat —{" "}
            <span className="text-brand">{results.length} matcher hittade</span>
          </h2>
          {results.map((match, i) => (
            <AnalyzedMatchCard key={i} match={match} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyzedMatchCard({
  match,
  index,
}: {
  match: AnalyzedMatchResult;
  index: number;
}) {
  const edgeHome = match.probability.home - match.streckning.home;
  const edgeDraw = match.probability.draw - match.streckning.draw;
  const edgeAway = match.probability.away - match.streckning.away;

  const bestEdge = Math.max(edgeHome, edgeDraw, edgeAway);
  const bestSign =
    bestEdge === edgeHome ? "1" : bestEdge === edgeDraw ? "X" : "2";

  const valueScore = Math.min(
    100,
    Math.max(0, Math.round(50 + bestEdge * 2.5))
  );

  const recommendation =
    valueScore >= 75 && match.probability.home >= 55
      ? "Spik"
      : bestEdge >= 8 && match.probability[bestSign === "1" ? "home" : bestSign === "X" ? "draw" : "away"] <= 30
      ? "Skräll"
      : valueScore < 50
      ? "Gardering"
      : "Normal";

  const recColor =
    recommendation === "Spik"
      ? "text-accent-green border-accent-green/30 bg-accent-green/10"
      : recommendation === "Skräll"
      ? "text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10"
      : recommendation === "Gardering"
      ? "text-brand border-brand/30 bg-brand/10"
      : "text-slate-400 border-slate-600 bg-slate-700/30";

  return (
    <div className="bg-surface-card border border-slate-700 hover:border-brand/40 rounded-2xl p-5 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Match {index + 1} · {match.league ?? "Okänd liga"}
          </div>
          <div className="font-bold text-lg">
            {match.homeTeam}{" "}
            <span className="text-slate-500 font-normal">vs</span>{" "}
            {match.awayTeam}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${recColor}`}
        >
          {recommendation === "Spik"
            ? "🔒"
            : recommendation === "Skräll"
            ? "⚡"
            : recommendation === "Gardering"
            ? "🛡️"
            : "📊"}{" "}
          {recommendation}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {(["home", "draw", "away"] as const).map((key, i) => {
          const sign = i === 0 ? "1" : i === 1 ? "X" : "2";
          const edge =
            key === "home" ? edgeHome : key === "draw" ? edgeDraw : edgeAway;
          const isValue = edge > 3;
          const isOver = edge < -5;
          return (
            <div
              key={key}
              className={`rounded-xl p-3 border text-center ${
                isValue
                  ? "border-accent-green/40 bg-accent-green/5"
                  : isOver
                  ? "border-accent-red/40 bg-accent-red/5"
                  : "border-slate-700 bg-surface"
              }`}
            >
              <div className="text-xs text-slate-500 mb-1">{sign}</div>
              {match.odds && (
                <div className="font-bold text-sm mb-1">
                  {match.odds[key]?.toFixed(2) ?? "—"}
                </div>
              )}
              <div className="text-xs text-slate-400">
                {match.probability[key]}%{" "}
                <span className="text-slate-600">sannolikhet</span>
              </div>
              <div className="text-xs text-slate-400">
                {match.streckning[key]}%{" "}
                <span className="text-slate-600">streckat</span>
              </div>
              <div
                className={`text-xs font-bold mt-1 ${
                  edge > 0 ? "text-accent-green" : "text-accent-red"
                }`}
              >
                {edge > 0 ? "+" : ""}
                {edge.toFixed(1)}% edge
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-brand to-accent-green"
            style={{ width: `${valueScore}%` }}
          />
        </div>
        <div className="text-sm font-semibold text-brand">
          {valueScore}{" "}
          <span className="text-xs font-normal text-slate-500">
            /{" "}
            {valueScore >= 85
              ? "Utmärkt"
              : valueScore >= 70
              ? "Bra"
              : valueScore >= 55
              ? "OK"
              : "Svagt"}
          </span>
        </div>
      </div>

      {match.rawText && (
        <p className="text-slate-500 text-xs mt-3 pt-3 border-t border-slate-700 leading-relaxed">
          {match.rawText}
        </p>
      )}
    </div>
  );
      }
