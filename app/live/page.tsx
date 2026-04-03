"use client";

import { useState, useEffect, useCallback } from "react";
import MatchCard from "@/components/MatchCard";
import type { Match } from "@/data/matches";

interface LiveResponse {
  matches: Match[];
  fetchedAt: number;
  cached: boolean;
  error?: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function LivePage() {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/live-matches");
      const json = await res.json() as LiveResponse;
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setStatus("success");
    } catch (err) {
      setData({ matches: [], fetchedAt: Date.now(), cached: false, error: err instanceof Error ? err.message : "Okänt fel" });
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const spikar = data?.matches.filter((m) => m.recommendation === "spik") ?? [];
  const garderingar = data?.matches.filter((m) => m.recommendation === "gardering") ?? [];
  const skrall = data?.matches.filter((m) => m.recommendation === "skräll") ?? [];
  const rest = data?.matches.filter((m) => m.recommendation === "normal") ?? [];

  const sections = [
    { title: "🔒 Spikar", items: spikar },
    { title: "⚡ Skrällvarningar", items: skrall },
    { title: "🛡️ Garderingar", items: garderingar },
    { title: "📊 Övriga matcher", items: rest },
  ];

  const fetchedTime = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-accent-green/10 border border-accent-green/30 rounded-full px-3 py-1 text-accent-green text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            Live data · football-data.org
          </div>
          <h1 className="text-4xl font-extrabold mb-2">Live matchanalys</h1>
          <p className="text-slate-400 max-w-2xl">
            Kommande matcher hämtade live och analyserade av AI för Stryktips-värde.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {fetchedTime && (
            <span className="text-xs text-slate-500">
              {data?.cached ? "Cachad" : "Hämtad"} {fetchedTime}
            </span>
          )}
          <button
            onClick={load}
            disabled={status === "loading"}
            className="flex items-center gap-2 bg-surface-card border border-slate-600 hover:border-brand/50 transition px-4 py-2 rounded-xl text-sm font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className={status === "loading" ? "animate-spin" : ""}>↻</span>
            {status === "loading" ? "Hämtar..." : "Uppdatera"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="w-14 h-14 rounded-full border-4 border-brand/30 border-t-brand animate-spin" />
          <div className="text-center">
            <p className="text-slate-300 font-semibold text-lg">Hämtar live-matcher...</p>
            <p className="text-slate-500 text-sm mt-1">AI analyserar varje match — tar 10–20 sekunder</p>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && data?.error && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-2xl p-6 text-center">
          <p className="text-accent-red font-semibold mb-1">Kunde inte hämta matcher</p>
          <p className="text-slate-400 text-sm">{data.error}</p>
          <button
            onClick={load}
            className="mt-4 bg-brand hover:bg-brand-dark transition px-5 py-2 rounded-xl text-sm font-semibold text-white"
          >
            Försök igen
          </button>
        </div>
      )}

      {/* Empty */}
      {status === "success" && data?.matches.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          Inga kommande matcher hittades. Prova igen senare.
        </div>
      )}

      {/* Matches */}
      {status === "success" && (data?.matches.length ?? 0) > 0 && (
        <>
          {sections.map(
            (section) =>
              section.items.length > 0 && (
                <div key={section.title} className="mb-12">
                  <h2 className="text-xl font-bold mb-4 text-slate-200">
                    {section.title}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((match) => (
                      <MatchCard key={match.id} match={match} expanded />
                    ))}
                  </div>
                </div>
              )
          )}
        </>
      )}
    </div>
  );
}
