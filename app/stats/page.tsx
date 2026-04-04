"use client";

import { useState, useEffect, useMemo } from "react";
import { betHistory as seedData, calculatePerformance, calculateCLV } from "@/data/betHistory";
import type { BetRecord, BetOutcome } from "@/data/betHistory";

const STORAGE_KEY = "bet-history-v1";
const BANKROLL_KEY = "bankroll-v1";

function loadHistory(): BetRecord[] {
  if (typeof window === "undefined") return seedData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : seedData;
  } catch {
    return seedData;
  }
}

function saveHistory(h: BetRecord[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch {}
}

function isPendingExpired(bet: BetRecord): boolean {
  if (bet.outcome !== "pending") return false;
  const d = new Date(bet.date);
  return Date.now() - d.getTime() > 48 * 60 * 60 * 1000;
}

// Minimal inline bar chart — no external deps
function CLVChart({ bets }: { bets: BetRecord[] }) {
  const data = bets
    .filter((b) => b.closingOdds != null && b.closingOdds > 0)
    .slice(-20)
    .map((b) => ({
      label: b.homeTeam.slice(0, 8),
      clv: Math.round(((b.yourOdds / b.closingOdds!) - 1) * 1000) / 10,
    }));

  if (data.length === 0) {
    return <p className="text-slate-500 text-sm">Ingen CLV-data ännu.</p>;
  }

  const max = Math.max(...data.map((d) => Math.abs(d.clv)), 10);

  return (
    <div className="space-y-1.5">
      {data.map((d, i) => {
        const pct = Math.abs(d.clv) / max;
        const positive = d.clv >= 0;
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-20 text-slate-500 truncate text-right">{d.label}</div>
            <div className="flex-1 flex items-center gap-1">
              <div
                className={`h-4 rounded ${positive ? "bg-accent-green/60" : "bg-accent-red/60"}`}
                style={{ width: `${Math.max(pct * 100, 2)}%` }}
              />
              <span className={`font-semibold ${positive ? "text-accent-green" : "text-accent-red"}`}>
                {d.clv > 0 ? "+" : ""}{d.clv}%
              </span>
            </div>
          </div>
        );
      })}
      {/* +3% reference hint */}
      <div className="text-xs text-slate-600 mt-1">
        Mål: snitt-CLV &gt; +3% (referenslinje)
      </div>
    </div>
  );
}

const EMPTY_FORM: Omit<BetRecord, "id"> = {
  date: new Date().toISOString().slice(0, 10),
  homeTeam: "",
  awayTeam: "",
  league: "",
  sign: "1",
  yourOdds: 2.0,
  stake: 100,
  yourProbability: 50,
  outcome: "pending",
  betType: "single",
  notes: "",
};

export default function StatsPage() {
  const [history, setHistory] = useState<BetRecord[]>([]);
  const [bankroll, setBankroll] = useState(5000);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<BetRecord, "id">>(EMPTY_FORM);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    try {
      const raw = localStorage.getItem(BANKROLL_KEY);
      if (raw) setBankroll(Number(raw));
    } catch {}
    setMounted(true);
  }, []);

  const updateHistory = (next: BetRecord[]) => {
    setHistory(next);
    saveHistory(next);
  };

  const addBet = () => {
    if (!form.homeTeam.trim()) return;
    const id = `bet-${Date.now()}`;
    const profit =
      form.outcome === "win"
        ? Math.round((form.yourOdds - 1) * form.stake)
        : form.outcome === "loss"
        ? -form.stake
        : undefined;
    const entry: BetRecord = { ...form, id, profit };
    updateHistory([entry, ...history]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const markOutcome = (id: string, outcome: BetOutcome) => {
    updateHistory(
      history.map((b) => {
        if (b.id !== id) return b;
        const profit =
          outcome === "win"
            ? Math.round((b.yourOdds - 1) * b.stake)
            : outcome === "loss"
            ? -b.stake
            : undefined;
        return { ...b, outcome, profit };
      })
    );
  };

  const deleteBet = (id: string) => {
    updateHistory(history.filter((b) => b.id !== id));
  };

  const saveBankroll = (val: number) => {
    setBankroll(val);
    try { localStorage.setItem(BANKROLL_KEY, String(val)); } catch {}
  };

  const perf = useMemo(() => calculatePerformance(history), [history]);
  const settled = history.filter((b) => b.outcome === "win" || b.outcome === "loss");

  // Kelly recommendation (simplified: f = (p*(b+1) - 1) / b where p=winRate, b=avgOdds-1)
  const kellyFraction = useMemo(() => {
    if (settled.length < 5) return null;
    const p = perf.winRate / 100;
    const b = perf.avgOdds - 1;
    if (b <= 0) return null;
    const f = (p * (b + 1) - 1) / b;
    return Math.max(0, Math.round(f * 1000) / 10);
  }, [perf, settled.length]);

  // Calibration: bin bets by yourProbability, compare to actual win rate
  const calibration = useMemo(() => {
    const bins: Record<string, { total: number; wins: number; midpoint: number }> = {
      "0-30": { total: 0, wins: 0, midpoint: 15 },
      "30-50": { total: 0, wins: 0, midpoint: 40 },
      "50-70": { total: 0, wins: 0, midpoint: 60 },
      "70-100": { total: 0, wins: 0, midpoint: 85 },
    };
    for (const b of settled) {
      const p = b.yourProbability;
      const key = p < 30 ? "0-30" : p < 50 ? "30-50" : p < 70 ? "50-70" : "70-100";
      bins[key].total++;
      if (b.outcome === "win") bins[key].wins++;
    }
    return bins;
  }, [settled]);

  if (!mounted) return null;

  return (
    <div>
      <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold mb-2">Prestationsanalys</h1>
          <p className="text-slate-400 max-w-2xl">
            Spårning av ROI, CLV och vinstfrekvens. Logga varje spel — det är
            enda sättet att bevisa att metoden verkligen ger edge.
          </p>
        </div>
        <button
          className="bg-brand hover:bg-brand-dark transition px-5 py-2 rounded-xl font-semibold text-white shadow-lg shadow-brand/25 text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Avbryt" : "+ Nytt spel"}
        </button>
      </div>

      {/* Add bet form */}
      {showForm && (
        <div className="mb-8 bg-surface-card border border-brand/30 rounded-2xl p-5">
          <h2 className="font-bold text-base mb-4 text-brand">Lägg till spel</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Datum</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Hemmalag *</label>
              <input
                value={form.homeTeam}
                onChange={(e) => setForm({ ...form, homeTeam: e.target.value })}
                placeholder="t.ex. Malmö FF"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Bortalag</label>
              <input
                value={form.awayTeam}
                onChange={(e) => setForm({ ...form, awayTeam: e.target.value })}
                placeholder="t.ex. AIK"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Liga</label>
              <input
                value={form.league}
                onChange={(e) => setForm({ ...form, league: e.target.value })}
                placeholder="t.ex. Allsvenskan"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Tecken</label>
              <select
                value={form.sign}
                onChange={(e) => setForm({ ...form, sign: e.target.value as "1" | "X" | "2" })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="1">1 (Hemma)</option>
                <option value="X">X (Oavgjort)</option>
                <option value="2">2 (Borta)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Dina odds</label>
              <input
                type="number"
                step="0.01"
                value={form.yourOdds}
                onChange={(e) => setForm({ ...form, yourOdds: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Insats (kr)</label>
              <input
                type="number"
                value={form.stake}
                onChange={(e) => setForm({ ...form, stake: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Din sannolikhet (%)</label>
              <input
                type="number"
                min="1"
                max="99"
                value={form.yourProbability}
                onChange={(e) => setForm({ ...form, yourProbability: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Utfall</label>
              <select
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value as BetOutcome })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="pending">Pågår</option>
                <option value="win">Vann</option>
                <option value="loss">Förlorad</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Stängningsodd (CLV)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Frivillig"
                value={form.closingOdds ?? ""}
                onChange={(e) => setForm({ ...form, closingOdds: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 block mb-1">Anteckningar</label>
              <input
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Frivillig"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>
          <button
            onClick={addBet}
            disabled={!form.homeTeam.trim()}
            className="bg-brand hover:bg-brand-dark disabled:opacity-40 transition px-6 py-2 rounded-xl font-semibold text-white text-sm"
          >
            Lägg till
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard label="ROI" value={`${perf.roi > 0 ? "+" : ""}${perf.roi}%`} sub={`${perf.totalProfit > 0 ? "+" : ""}${perf.totalProfit} kr vinst`} color={perf.roi >= 0 ? "text-accent-green" : "text-accent-red"} />
        <KpiCard label="Vinstfrekvens" value={`${perf.winRate}%`} sub={`${perf.wins}V / ${perf.losses}F / ${perf.pending}P`} color="text-brand" />
        <KpiCard label="Avg CLV" value={`${perf.avgCLV > 0 ? "+" : ""}${perf.avgCLV}%`} sub="Closing Line Value" color={perf.avgCLV >= 0 ? "text-accent-green" : "text-accent-red"} />
        <KpiCard label="Bästa serie" value={`${perf.bestStreak}V`} sub={`Nuvarande: ${perf.currentStreak}V i rad`} color="text-accent-yellow" />
      </div>

      {/* Bankroll section */}
      <div className="mb-8 bg-surface-card border border-slate-700 rounded-2xl p-5">
        <h2 className="font-bold text-base mb-3">Bankroll</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="text-xs text-slate-500 mb-1">Nuvarande bankroll</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bankroll}
                onChange={(e) => saveBankroll(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-lg font-bold text-slate-200 w-32"
              />
              <span className="text-slate-400 text-sm">kr</span>
            </div>
          </div>
          {kellyFraction !== null && (
            <div className="bg-brand/10 border border-brand/30 rounded-xl px-5 py-3">
              <div className="text-xs text-slate-500 mb-1">Kelly-rekommendation</div>
              <div className="text-xl font-bold text-brand">{kellyFraction}%</div>
              <div className="text-xs text-slate-500">= {Math.round(bankroll * kellyFraction / 100)} kr per spel</div>
            </div>
          )}
          {kellyFraction === null && (
            <div className="text-sm text-slate-500">Kelly beräknas efter 5+ avgjorda spel.</div>
          )}
          <div className="text-xs text-slate-600">
            Kelly är ett riktmärke — halvera alltid rekommendationen för att minska varians.
          </div>
        </div>
      </div>

      {/* CLV chart */}
      <div className="mb-8 bg-surface-card border border-brand/20 rounded-2xl p-5">
        <h2 className="font-bold text-base mb-2 text-brand">CLV-historik (senaste 20 spel)</h2>
        <p className="text-slate-400 text-sm mb-4">
          Konsistent CLV &gt; +3% är det starkaste beviset på att din metod fungerar.
        </p>
        <CLVChart bets={settled} />
        <div className="mt-3 flex gap-6 text-sm">
          <div><span className="text-slate-500">Snitt-CLV: </span><span className={`font-bold ${perf.avgCLV >= 3 ? "text-accent-green" : perf.avgCLV >= 0 ? "text-accent-yellow" : "text-accent-red"}`}>{perf.avgCLV > 0 ? "+" : ""}{perf.avgCLV}%</span></div>
          <div><span className="text-slate-500">Snitt-odds: </span><span className="font-bold text-slate-300">{perf.avgOdds}</span></div>
          <div><span className="text-slate-500">Total insats: </span><span className="font-bold text-slate-300">{perf.totalStaked} kr</span></div>
        </div>
      </div>

      {/* Calibration section */}
      <div className="mb-8 bg-surface-card border border-slate-700 rounded-2xl p-5">
        <h2 className="font-bold text-base mb-2">Kalibrering</h2>
        <p className="text-slate-400 text-sm mb-4">
          Stämmer dina sannolikhetsbedömningar med verkligheten?
        </p>
        {settled.length < 10 ? (
          <div className="text-accent-yellow text-sm bg-accent-yellow/5 border border-accent-yellow/20 rounded-xl p-4">
            Behöver fler spel — minst 10 avgjorda spel för kalibrering ({settled.length} hittills).
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(calibration).map(([range, data]) => {
              const actual = data.total > 0 ? Math.round((data.wins / data.total) * 100) : null;
              const diff = actual !== null ? actual - data.midpoint : null;
              return (
                <div key={range} className="flex items-center gap-3 text-sm">
                  <div className="w-16 text-slate-500 text-xs">{range}%</div>
                  <div className="w-8 text-slate-400 text-xs text-right">{data.total} st</div>
                  {actual !== null ? (
                    <>
                      <div className="flex-1 bg-slate-800 rounded h-3 overflow-hidden">
                        <div className="h-full bg-brand/60 rounded" style={{ width: `${actual}%` }} />
                      </div>
                      <div className="w-16 text-xs font-semibold text-slate-300">{actual}% faktiskt</div>
                      <div className={`w-16 text-xs font-semibold ${diff! >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                        {diff! > 0 ? "+" : ""}{diff}pp
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-600 text-xs">Inga spel</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ROI per liga */}
      {Object.keys(perf.byLeague).length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">ROI per liga</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(perf.byLeague).map(([league, data]) => (
              <div key={league} className="bg-surface-card border border-slate-700 rounded-xl p-4">
                <div className="text-slate-400 text-sm font-medium">{league}</div>
                <div className={`text-xl font-bold mt-1 ${data.roi >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {data.roi > 0 ? "+" : ""}{data.roi}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{data.bets} spel</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spellog */}
      <div>
        <h2 className="text-xl font-bold mb-4">Spellog</h2>
        <div className="space-y-2">
          {history.map((bet) => {
            const clv = calculateCLV(bet);
            const expired = isPendingExpired(bet);
            return (
              <div
                key={bet.id}
                className={`bg-surface-card border rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 ${
                  bet.outcome === "win"
                    ? "border-accent-green/20"
                    : bet.outcome === "loss"
                    ? "border-accent-red/20"
                    : expired
                    ? "border-accent-yellow/40"
                    : "border-slate-700"
                }`}
              >
                <div className="text-xs text-slate-500 w-20">{bet.date}</div>
                <div className="flex-1 min-w-[140px]">
                  <div className="font-semibold text-sm">{bet.homeTeam}{bet.awayTeam ? ` – ${bet.awayTeam}` : ""}</div>
                  <div className="text-xs text-slate-500">{bet.league}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-0.5 rounded font-bold ${bet.sign === "X" ? "bg-slate-700 text-slate-300" : "bg-brand/20 text-brand"}`}>{bet.sign}</span>
                  <span className="text-slate-300 font-semibold">@{bet.yourOdds.toFixed(2)}</span>
                  {clv !== null && (
                    <span className={`text-xs ${clv >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                      CLV {clv > 0 ? "+" : ""}{clv}%
                    </span>
                  )}
                </div>
                <div className="text-sm"><span className="text-slate-500">{bet.stake} kr</span></div>
                <div className="text-sm font-bold">
                  {bet.outcome === "win" ? (
                    <span className="text-accent-green">+{bet.profit} kr</span>
                  ) : bet.outcome === "loss" ? (
                    <span className="text-accent-red">-{bet.stake} kr</span>
                  ) : (
                    <span className="text-slate-500">Pågår</span>
                  )}
                </div>
                <OutcomeBadge outcome={bet.outcome} />

                {expired && (
                  <div className="w-full text-xs text-accent-yellow bg-accent-yellow/5 border border-accent-yellow/20 rounded-lg px-3 py-1 mt-1">
                    ⚠ Utgånget — markera resultat
                  </div>
                )}

                {bet.outcome === "pending" && (
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => markOutcome(bet.id, "win")}
                      className="text-xs bg-accent-green/10 hover:bg-accent-green/20 text-accent-green border border-accent-green/20 px-3 py-1 rounded-lg font-semibold transition"
                    >
                      Vann
                    </button>
                    <button
                      onClick={() => markOutcome(bet.id, "loss")}
                      className="text-xs bg-accent-red/10 hover:bg-accent-red/20 text-accent-red border border-accent-red/20 px-3 py-1 rounded-lg font-semibold transition"
                    >
                      Förlorad
                    </button>
                  </div>
                )}

                <button
                  onClick={() => deleteBet(bet.id)}
                  className="text-xs text-slate-600 hover:text-accent-red transition ml-1"
                  title="Ta bort"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {settled.length < 20 && (
        <div className="mt-6 bg-accent-yellow/5 border border-accent-yellow/20 rounded-xl p-4 text-accent-yellow text-sm">
          <strong>Obs:</strong> Statistiken baseras på {settled.length} avgjorda spel.
          Minst 50–100 spel behövs för statistisk signifikans.
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-surface-card border border-slate-700 rounded-2xl p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === "win")
    return <span className="text-xs px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20 font-semibold">Vann</span>;
  if (outcome === "loss")
    return <span className="text-xs px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/20 font-semibold">Förlorad</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600 font-semibold">Pågår</span>;
}
