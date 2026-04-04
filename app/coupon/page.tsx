"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { matches } from "@/data/matches";
import CouponRow from "@/components/CouponRow";
import type { Selection } from "@/data/matches";
import { buildCouponStrategy } from "@/lib/stryktipsStrategy";

const ROUND_KEY = "stryktips-round-2025-v14";
const SAVED_KEY = "sparade-kuponger";

interface SavedCoupon {
  id: string;
  name: string;
  date: string;
  selections: Record<number, Selection[]>;
  rows: number;
  cost: number;
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const show = useCallback((msg: string, color = "text-accent-green") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  }, []);
  return { toast, show };
}

export default function CouponPage() {
  const [selections, setSelections] = useState<Record<number, Selection[]>>({});
  const [showStrategy, setShowStrategy] = useState(false);
  const [compact, setCompact] = useState(false);
  const [focusedRow, setFocusedRow] = useState(0); // 0-based index
  const [savedCoupons, setSavedCoupons] = useState<SavedCoupon[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const { toast, show: showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const strategy = useMemo(() => buildCouponStrategy(matches), []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ROUND_KEY);
      if (raw) setSelections(JSON.parse(raw));
      const savedRaw = localStorage.getItem(SAVED_KEY);
      if (savedRaw) setSavedCoupons(JSON.parse(savedRaw));
    } catch {}
  }, []);

  // Persist selections on change
  useEffect(() => {
    try {
      localStorage.setItem(ROUND_KEY, JSON.stringify(selections));
    } catch {}
  }, [selections]);

  const handleSelect = useCallback((matchId: number, sign: Selection) => {
    setSelections((prev) => {
      const current = prev[matchId] ?? [];
      const updated = current.includes(sign)
        ? current.filter((s) => s !== sign)
        : [...current, sign];
      return { ...prev, [matchId]: updated };
    });
  }, []);

  const applyStrategy = useCallback(() => {
    const newSelections: Record<number, Selection[]> = {};
    for (const m of strategy.matches) {
      newSelections[m.matchId] = m.recommendedSigns;
    }
    setSelections(newSelections);
  }, [strategy]);

  const combinations = Object.values(selections).reduce(
    (acc, sels) => acc * (sels.length || 1),
    1
  );
  const cost = combinations * 1;
  const coverage = ((Object.keys(selections).length / matches.length) * 100).toFixed(0);

  const selectedEV = useMemo(() => {
    let ev = 1;
    for (const match of matches) {
      const sel = selections[match.id];
      if (!sel || sel.length === 0) continue;
      let probSum = 0;
      let streckSum = 0;
      for (const sign of sel) {
        const key = sign === "1" ? "home" : sign === "X" ? "draw" : "away";
        probSum += match.probabilities[key];
        streckSum += match.streckning[key];
      }
      if (streckSum > 0) ev *= probSum / streckSum;
    }
    return Math.round(ev * 100) / 100;
  }, [selections]);

  const saveCoupon = useCallback(() => {
    const id = `kupong-${Date.now()}`;
    const name = `Kupong ${new Date().toLocaleDateString("sv-SE")} – ${combinations} rad${combinations !== 1 ? "er" : ""}`;
    const entry: SavedCoupon = {
      id,
      name,
      date: new Date().toISOString(),
      selections,
      rows: combinations,
      cost,
    };
    const updated = [entry, ...savedCoupons].slice(0, 20);
    setSavedCoupons(updated);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    } catch {}
    showToast("✓ Kupong sparad!");
  }, [selections, combinations, cost, savedCoupons, showToast]);

  const deleteSaved = useCallback((id: string) => {
    setSavedCoupons((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const loadSaved = useCallback((c: SavedCoupon) => {
    setSelections(c.selections);
    setShowSaved(false);
    showToast(`Laddade: ${c.name}`, "text-brand");
  }, [showToast]);

  const copyRow = useCallback((matchIndex: number) => {
    const match = matches[matchIndex];
    const sel = selections[match.id];
    const text = `${match.matchNumber}. ${match.homeTeam} – ${match.awayTeam}: ${sel && sel.length > 0 ? sel.join("/") : "–"}`;
    navigator.clipboard.writeText(text).then(() => showToast("Rad kopierad!"));
  }, [selections, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      const match = matches[focusedRow];
      if (!match) return;

      if (e.key === "1") {
        handleSelect(match.id, "1");
      } else if (e.key === "x" || e.key === "X" || e.key === "5") {
        handleSelect(match.id, "X");
      } else if (e.key === "2") {
        handleSelect(match.id, "2");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRow((r) => Math.min(r + 1, matches.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRow((r) => Math.max(r - 1, 0));
      } else if (e.key === "a" || e.key === "A") {
        applyStrategy();
        showToast("AI-strategi tillämpad", "text-brand");
      } else if (e.key === "s" || e.key === "S") {
        saveCoupon();
      } else if (e.key === "r" || e.key === "R") {
        setSelections({});
        showToast("Kupong rensad", "text-accent-yellow");
      } else if (e.key === "c" || e.key === "C") {
        copyRow(focusedRow);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusedRow, handleSelect, applyStrategy, saveCoupon, copyRow, showToast]);

  return (
    <div ref={containerRef}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 bg-surface-card border border-slate-600 rounded-xl px-5 py-3 shadow-xl text-sm font-semibold ${toast.color} transition-all`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold mb-2">Bygg din kupong</h1>
          <p className="text-slate-400">
            Välj 1, X eller 2 för varje match. Välj flera för gardering.
            Tangentbord: <kbd className="text-xs bg-slate-700 px-1 rounded">1</kbd>{" "}
            <kbd className="text-xs bg-slate-700 px-1 rounded">X</kbd>{" "}
            <kbd className="text-xs bg-slate-700 px-1 rounded">2</kbd>{" "}
            <kbd className="text-xs bg-slate-700 px-1 rounded">↑↓</kbd>{" "}
            <kbd className="text-xs bg-slate-700 px-1 rounded">A</kbd>=strategi{" "}
            <kbd className="text-xs bg-slate-700 px-1 rounded">S</kbd>=spara{" "}
            <kbd className="text-xs bg-slate-700 px-1 rounded">R</kbd>=rensa{" "}
            <kbd className="text-xs bg-slate-700 px-1 rounded">C</kbd>=kopiera rad
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 px-3 py-2 rounded-xl font-semibold transition"
            onClick={() => setCompact((v) => !v)}
          >
            {compact ? "Detaljerad" : "Kompakt"}
          </button>
          <button
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 px-3 py-2 rounded-xl font-semibold transition relative"
            onClick={() => setShowSaved((v) => !v)}
          >
            Sparade kuponger
            {savedCoupons.length > 0 && (
              <span className="ml-1.5 bg-brand text-white rounded-full text-xs px-1.5">{savedCoupons.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Saved coupons panel */}
      {showSaved && (
        <div className="mb-6 bg-surface-card border border-slate-700 rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-3 text-slate-300">Sparade kuponger</h2>
          {savedCoupons.length === 0 ? (
            <p className="text-slate-500 text-sm">Inga sparade kuponger.</p>
          ) : (
            <div className="space-y-2">
              {savedCoupons.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 text-sm bg-slate-800 rounded-xl px-4 py-2">
                  <div>
                    <div className="font-medium text-slate-200">{c.name}</div>
                    <div className="text-xs text-slate-500">{new Date(c.date).toLocaleString("sv-SE")} · {c.rows} rader · {c.cost} kr</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-xs bg-brand/20 hover:bg-brand/30 text-brand border border-brand/30 px-3 py-1 rounded-lg font-semibold transition"
                      onClick={() => loadSaved(c)}
                    >
                      Ladda
                    </button>
                    <button
                      className="text-xs bg-accent-red/10 hover:bg-accent-red/20 text-accent-red border border-accent-red/20 px-3 py-1 rounded-lg font-semibold transition"
                      onClick={() => deleteSaved(c.id)}
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strategy panel */}
      <div className="mb-6 bg-surface-card border border-brand/30 rounded-2xl p-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI-Strategi</div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-slate-400 text-sm">Rekommenderade rader: </span>
                <span className="text-brand font-bold text-lg">{strategy.totalRows}</span>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Konfidenspoäng: </span>
                <span className={`font-bold text-lg ${strategy.confidenceScore >= 75 ? "text-accent-green" : strategy.confidenceScore >= 60 ? "text-accent-yellow" : "text-accent-red"}`}>
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
              onClick={() => { applyStrategy(); showToast("AI-strategi tillämpad", "text-brand"); }}
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
                  <span className="text-slate-400">{m.matchNumber}. {m.homeTeam} - {m.awayTeam}</span>
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

      {/* Sticky status bar */}
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
            <div className="text-xs text-slate-500 uppercase tracking-wider">Pool EV</div>
            <div className={`text-2xl font-bold ${selectedEV >= 1.05 ? "text-accent-green" : selectedEV >= 0.95 ? "text-accent-yellow" : "text-accent-red"}`}>
              {selectedEV}x
            </div>
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button
            className="text-sm bg-slate-700 hover:bg-slate-600 transition px-4 py-2 rounded-xl font-semibold text-slate-300"
            onClick={() => { setSelections({}); showToast("Kupong rensad", "text-accent-yellow"); }}
          >
            Rensa
          </button>
          <button
            className="bg-brand hover:bg-brand-dark transition px-6 py-2 rounded-xl font-semibold text-white shadow-lg shadow-brand/25"
            onClick={saveCoupon}
          >
            Spara kupong
          </button>
        </div>
      </div>

      {/* Match rows */}
      <div className="space-y-3">
        {matches.map((match, idx) => (
          <div
            key={match.id}
            className={`rounded-xl transition-all cursor-pointer ${focusedRow === idx ? "ring-2 ring-brand/50" : ""}`}
            onClick={() => setFocusedRow(idx)}
          >
            {compact ? (
              /* Compact view */
              <div className="bg-surface-card border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-2 flex items-center gap-4">
                <span className="w-5 text-slate-500 text-sm font-mono">{match.matchNumber}</span>
                <span className="flex-1 text-sm font-semibold truncate">
                  {match.homeTeam} <span className="text-slate-500 font-normal text-xs">vs</span> {match.awayTeam}
                </span>
                <div className="flex gap-2">
                  {(["1", "X", "2"] as Selection[]).map((sign) => (
                    <button
                      key={sign}
                      onClick={(e) => { e.stopPropagation(); handleSelect(match.id, sign); }}
                      className={`w-8 h-8 rounded-lg font-bold text-xs border transition ${
                        (selections[match.id] ?? []).includes(sign)
                          ? "bg-brand border-brand text-white"
                          : "border-slate-600 text-slate-400 hover:border-slate-400"
                      }`}
                    >
                      {sign}
                    </button>
                  ))}
                </div>
                <button
                  className="text-xs text-slate-500 hover:text-slate-300 transition px-2"
                  title="Kopiera rad"
                  onClick={(e) => { e.stopPropagation(); copyRow(idx); }}
                >
                  Kopiera rad
                </button>
              </div>
            ) : (
              /* Detailed view */
              <div className="relative group">
                <CouponRow
                  match={match}
                  selections={selections[match.id] ?? []}
                  onSelect={(sign) => handleSelect(match.id, sign)}
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 hover:text-slate-300 transition opacity-0 group-hover:opacity-100 px-2 py-1 rounded"
                  onClick={(e) => { e.stopPropagation(); copyRow(idx); }}
                >
                  Kopiera rad
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="mt-6 text-xs text-slate-600 text-center">
        Fokuserad rad: {focusedRow + 1} · Tangentbordsgenvägar aktiva
      </div>
    </div>
  );
}
