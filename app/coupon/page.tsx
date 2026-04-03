"use client";

import { useState, useMemo } from "react";
import { matches } from "@/data/matches";
import CouponRow from "@/components/CouponRow";
import type { Selection } from "@/data/matches";
import { buildCouponStrategy } from "@/lib/stryktipsStrategy";

export default function CouponPage() {
  const [selections, setSelections] = useState<Record<number, Selection[]>>({});
  const [showStrategy, setShowStrategy] = useState(false);

  const strategy = useMemo(() => buildCouponStrategy(matches), []);

  const handleSelect = (matchId: number, sign: Selection) => {
    setSelections((prev) => {
      const current = prev[matchId] ?? [];
      if (current.includes(sign)) {
        const updated = current.filter((s) => s !== sign);
        return { ...prev, [matchId]: updated };
      }
      return { ...prev, [matchId]: [...current, sign] };
    });
  };

  const applyStrategy = () => {
    const newSelections: Record<number, Selection[]> = {};
    for (const m of strategy.matches) {
      newSelections[m.matchId] = m.recommendedSigns;
    }
    setSelections(newSelections);
  };

  const combinations = Object.values(selections).reduce(
    (acc, sels) => acc * (sels.length || 1),
    1
  );

  const cost = combinations * 1;
  const coverage = (
    (Object.keys(selections).length / matches.length) *
    100
  ).toFixed(0);

  // Beräkna estimerad EV baserat på valda tecken
  const selectedEV = useMemo(() => {
    let ev = 1;
    for (const match of matches) {
      const sel = selections[match.id];
      if (!sel || sel.length === 0) continue;
      // EV för valda tecken: genomsnitt av sannolikheter / genomsnitt av streckning
      let probSum = 0;
      let streckSum = 0;
      for (const sign of sel) {
        const key = sign === "1" ? "home" : sign === "X" ? "draw" : "away";
        probSum += match.probabilities[key];
        streckSum += match.streckning[key];
      }
      if (streckSum > 0) {
        ev *= (probSum / streckSum);
      }
    }
    return Math.round(ev * 100) / 100;
  }, [selections]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2">Bygg din kupong</h1>
        <p className="text-slate-400">
          Välj 1, X eller 2 för varje match. Välj flera för gardering.
          Streckningsprocent visas för att identifiera pool-value.
        </p>
      </div>

      {/* Strategi-panel */}
      <div className="mb-6 bg-surface-card border border-brand/30 rounded-2xl p-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              AI-Strategi
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-slate-400 text-sm">Rekommenderade rader: </span>
                <span className="text-brand font-bold text-lg">{strategy.totalRows}</span>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Konfidenspoäng: </span>
                <span
                  className={`font-bold text-lg ${
                    strategy.confidenceScore >= 75
                      ? "text-accent-green"
                      : strategy.confidenceScore >= 60
                      ? "text-accent-yellow"
                      : "text-accent-red"
                  }`}
                >
                  {strategy.confidenceScore}/100
                </span>
              </div>
              {strategy.topSkrall.length > 0 && (
                <div className="text-xs bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow px-3 py-1 rounded-full">
                  ⚡ {strategy.topSkrall.length} skräll-kandidat{strategy.topSkrall.length > 1 ? "er" : ""}
                </div>
              )}
              {strategy.topSpikar.length > 0 && (
                <div className="text-xs bg-accent-green/10 border border-accent-green/30 text-accent-green px-3 py-1 rounded-full">
                  🔒 {strategy.topSpikar.length} spik{strategy.topSpikar.length > 1 ? "ar" : ""}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="text-xs bg-brand/20 hover:bg-brand/30 text-brand border border-brand/40 transition px-4 py-2 rounded-xl font-semibold"
              onClick={() => setShowStrategy((v) => !v)}
            >
              {showStrategy ? "Dölj" : "Visa"} strategi
            </button>
            <button
              className="text-xs bg-brand hover:bg-brand-dark transition px-4 py-2 rounded-xl font-semibold text-white shadow-md shadow-brand/20"
              onClick={applyStrategy}
            >
              Tillämpa AI-strategi
            </button>
          </div>
        </div>

        {showStrategy && (
          <div className="mt-4 border-t border-slate-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {strategy.matches.map((m) => (
              <div
                key={m.matchId}
                className={`flex items-start justify-between text-xs p-2 rounded-lg ${
                  m.confidence === "spik"
                    ? "bg-accent-green/5 border border-accent-green/20"
                    : m.confidence === "skräll"
                    ? "bg-accent-yellow/5 border border-accent-yellow/20"
                    : m.confidence === "gardering"
                    ? "bg-brand/5 border border-brand/20"
                    : "bg-slate-700/20 border border-slate-700"
                }`}
              >
                <div>
                  <span className="text-slate-400">
                    {m.matchNumber}. {m.homeTeam} - {m.awayTeam}
                  </span>
                  <div className="text-slate-500 mt-0.5">{m.rationale}</div>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  {m.recommendedSigns.map((s) => (
                    <span
                      key={s}
                      className={`px-2 py-0.5 rounded font-bold ${
                        m.confidence === "spik"
                          ? "bg-accent-green/20 text-accent-green"
                          : m.confidence === "skräll"
                          ? "bg-accent-yellow/20 text-accent-yellow"
                          : "bg-brand/20 text-brand"
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky header med kupongstatus */}
      <div className="sticky top-4 z-10 bg-surface-card border border-slate-700 rounded-2xl p-4 mb-8 flex flex-wrap gap-6 items-center">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Rader</div>
          <div className="text-2xl font-bold text-brand">{combinations}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Kostnad</div>
          <div className="text-2xl font-bold text-accent-yellow">{cost} kr</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Täckning</div>
          <div className="text-2xl font-bold text-accent-green">{coverage}%</div>
        </div>
        {Object.keys(selections).length > 0 && (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">
              Pool EV
            </div>
            <div
              className={`text-2xl font-bold ${
                selectedEV >= 1.05
                  ? "text-accent-green"
                  : selectedEV >= 0.95
                  ? "text-accent-yellow"
                  : "text-accent-red"
              }`}
            >
              {selectedEV}x
            </div>
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button
            className="text-sm bg-slate-700 hover:bg-slate-600 transition px-4 py-2 rounded-xl font-semibold text-slate-300"
            onClick={() => setSelections({})}
          >
            Rensa
          </button>
          <button
            className="bg-brand hover:bg-brand-dark transition px-6 py-2 rounded-xl font-semibold text-white shadow-lg shadow-brand/25"
            onClick={() => alert("Kupong sparad! (Demonstration)")}
          >
            Spara kupong
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <CouponRow
            key={match.id}
            match={match}
            selections={selections[match.id] ?? []}
            onSelect={(sign) => handleSelect(match.id, sign)}
          />
        ))}
      </div>
    </div>
  );
}
