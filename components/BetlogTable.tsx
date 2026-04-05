"use client";

import { useState, useMemo } from "react";
import type { BetRecord } from "@/data/betHistory";
import { calculateCLV } from "@/data/betHistory";

type SortKey = "date" | "match" | "sign" | "odds" | "clv" | "stake" | "profit" | "outcome";
type SortDir = "asc" | "desc";

export function BetlogTable({ bets }: { bets: BetRecord[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...bets].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":    cmp = a.date.localeCompare(b.date); break;
        case "match":   cmp = a.homeTeam.localeCompare(b.homeTeam); break;
        case "sign":    cmp = a.sign.localeCompare(b.sign); break;
        case "odds":    cmp = a.yourOdds - b.yourOdds; break;
        case "clv": {
          const ca = calculateCLV(a) ?? -Infinity;
          const cb = calculateCLV(b) ?? -Infinity;
          cmp = ca - cb;
          break;
        }
        case "stake":   cmp = a.stake - b.stake; break;
        case "profit":  cmp = (a.profit ?? 0) - (b.profit ?? 0); break;
        case "outcome": cmp = a.outcome.localeCompare(b.outcome); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [bets, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortHeader({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        scope="col"
        onClick={() => toggleSort(col)}
        className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors ${
          active ? "text-brand" : "text-slate-500 hover:text-slate-300"
        }`}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        <span aria-hidden="true" className="ml-1">
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-700">
      <table className="w-full text-sm min-w-[640px]" aria-label="Spellog — alla loggade spel">
        <thead className="bg-surface-card border-b border-slate-700">
          <tr>
            <SortHeader col="date"    label="Datum" />
            <SortHeader col="match"   label="Match" />
            <SortHeader col="sign"    label="Tecken" />
            <SortHeader col="odds"    label="Odds" />
            <SortHeader col="clv"     label="CLV" />
            <SortHeader col="stake"   label="Insats" />
            <SortHeader col="profit"  label="Resultat" />
            <SortHeader col="outcome" label="Utfall" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {sorted.map((bet) => {
            const clv = calculateCLV(bet);
            return (
              <tr
                key={bet.id}
                className="hover:bg-surface-hover/20 transition-colors"
              >
                <td className="px-3 py-3 text-slate-500 whitespace-nowrap tabular-nums">
                  {bet.date}
                </td>
                <td className="px-3 py-3">
                  <div className="font-semibold text-slate-200 leading-snug">
                    {bet.homeTeam}
                    {bet.awayTeam ? ` – ${bet.awayTeam}` : ""}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{bet.league}</div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      bet.sign === "X"
                        ? "bg-slate-700 text-slate-300"
                        : "bg-brand/20 text-brand"
                    }`}
                    aria-label={
                      bet.sign === "1"
                        ? "Hemmavinst"
                        : bet.sign === "X"
                        ? "Oavgjort"
                        : "Bortavinst"
                    }
                  >
                    {bet.sign}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap tabular-nums">
                  <span className="font-semibold text-slate-200">
                    {bet.yourOdds.toFixed(2)}
                  </span>
                  {bet.closingOdds && (
                    <div className="text-xs text-slate-600 mt-0.5">
                      stängn. {bet.closingOdds.toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap tabular-nums">
                  {clv !== null ? (
                    <span
                      className={`font-semibold ${
                        clv >= 0 ? "text-accent-green" : "text-accent-red"
                      }`}
                    >
                      {clv > 0 ? "+" : ""}
                      {clv}%
                    </span>
                  ) : (
                    <span className="text-slate-600" aria-label="Ej tillgänglig">
                      –
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-400 whitespace-nowrap tabular-nums">
                  {bet.stake.toLocaleString("sv-SE")} kr
                </td>
                <td className="px-3 py-3 font-bold whitespace-nowrap tabular-nums">
                  {bet.outcome === "win" ? (
                    <span className="text-accent-green">
                      +{(bet.profit ?? 0).toLocaleString("sv-SE")} kr
                    </span>
                  ) : bet.outcome === "loss" ? (
                    <span className="text-accent-red">
                      −{bet.stake.toLocaleString("sv-SE")} kr
                    </span>
                  ) : (
                    <span className="text-slate-500">Pågår</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <OutcomeBadge outcome={bet.outcome} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === "win")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20 font-semibold whitespace-nowrap">
        Vann
      </span>
    );
  if (outcome === "loss")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/20 font-semibold whitespace-nowrap">
        Förlorad
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600 font-semibold whitespace-nowrap">
      Pågår
    </span>
  );
}
