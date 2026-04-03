"use client";

import { useState, useMemo } from "react";
import { matches } from "@/data/matches";
import CouponRow from "@/components/CouponRow";
import type { Selection } from "@/data/matches";

const MAX_COMBINATIONS = 2048;

export default function CouponPage() {
  const [selections, setSelections] = useState<Record<number, Selection[]>>({});

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

  const { combinations, cost, coverage, tooManyCombinations } = useMemo(() => {
    const combos = Object.values(selections).reduce(
      (acc, sels) => acc * (sels.length || 1),
      1
    );
    return {
      combinations: combos,
      cost: combos,
      coverage: ((Object.keys(selections).length / matches.length) * 100).toFixed(0),
      tooManyCombinations: combos > MAX_COMBINATIONS,
    };
  }, [selections]);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Bygg din kupong</h1>
        <p className="text-slate-400">
          Välj 1, X eller 2 för varje match. Välj flera för gardering.
        </p>
      </div>

      <div className="sticky top-4 z-10 bg-surface-card border border-slate-700 rounded-2xl p-4 mb-8 flex flex-wrap gap-6 items-center">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Rader</div>
          <div className={`text-2xl font-bold ${tooManyCombinations ? "text-accent-red" : "text-brand"}`}>
            {combinations.toLocaleString("sv-SE")}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Kostnad</div>
          <div className={`text-2xl font-bold ${tooManyCombinations ? "text-accent-red" : "text-accent-yellow"}`}>
            {cost.toLocaleString("sv-SE")} kr
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Täckning</div>
          <div className="text-2xl font-bold text-accent-green">{coverage}%</div>
        </div>
        <div className="ml-auto">
          <button
            className="bg-brand hover:bg-brand-dark transition px-6 py-2 rounded-xl font-semibold text-white shadow-lg shadow-brand/25 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => alert("Kupong sparad! (Demonstration)")}
            disabled={tooManyCombinations || combinations === 1}
            aria-label="Spara kupong"
          >
            Spara kupong
          </button>
        </div>
      </div>

      {tooManyCombinations && (
        <div className="mb-6 bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-accent-red text-sm">
          ⚠️ För många rader ({combinations.toLocaleString("sv-SE")}). Max {MAX_COMBINATIONS.toLocaleString("sv-SE")} rader tillåtet. Minska antalet garderingar.
        </div>
      )}

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
