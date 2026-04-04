"use client";

import React, { useState } from "react";
import { Opportunity } from "../lib/types";
import { TrendingUp, TrendingDown, Target, Zap, AlertCircle, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";

export function OpportunityCard({ opportunity, rank }: { opportunity: Opportunity; rank: number }) {
  const { event, inefficiencyScore, marketBelief, inefficiencyReasoning, sharpBreakdown, quantBreakdown } = opportunity;
  const [isSharpExpanded, setIsSharpExpanded] = useState(false);
  const [isQuantExpanded, setIsQuantExpanded] = useState(false);
  
  // Calculate if odds drifted or steamed
  const isDrift = event.odds.currentOdds > event.odds.openingOdds;
  
  return (
    <div className="bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-xl p-6 shadow-xl transition-all hover:border-emerald-500/30 hover:bg-gray-800/90 group mb-6">
      {/* Header section... */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">{event.sport}</span>
            <span>{event.leagueOrVenue}</span>
            <span>•</span>
            <span>{event.startTime}</span>
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
            {rank}. {event.name}
          </h3>
        </div>
        
        {/* Inefficiency Badge */}
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Inefficiency Score</div>
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 font-black text-2xl px-4 py-1 rounded-lg">
            {inefficiencyScore}
          </div>
        </div>
      </div>

      {/* Market Data */}
      <div className="bg-gray-900/50 rounded-lg p-4 mb-5 border border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Market: <strong className="text-gray-200">{event.odds.market}</strong></span>
          <span className="text-gray-400">Selection: <strong className="text-gray-200">{event.odds.selection}</strong></span>
        </div>
        
        <div className="flex items-center space-x-4 mt-4">
          <div className="bg-gray-800 px-4 py-2 rounded-md border border-gray-700 w-full flex justify-between items-center">
            <span className="text-sm text-gray-400">Opening (Syn.)</span>
            <span className="font-mono text-gray-300">{event.odds.openingOdds.toFixed(2)}</span>
          </div>
          <div className="text-gray-500">
            {isDrift ? <TrendingUp className="text-red-400" size={24} /> : <TrendingDown className="text-emerald-400" size={24} />}
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-md border border-gray-700 w-full flex justify-between items-center">
            <span className="text-sm text-gray-400">Current</span>
            <span className={`font-mono font-bold ${isDrift ? 'text-red-400' : 'text-emerald-400'}`}>
              {event.odds.currentOdds.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="mt-0.5 bg-red-500/20 p-1.5 rounded-full">
            <Target size={16} className="text-red-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">What the market believes</h4>
            <p className="text-gray-400 text-sm leading-relaxed">{marketBelief}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="mt-0.5 bg-emerald-500/20 p-1.5 rounded-full">
            <Zap size={16} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-400 mb-1 uppercase tracking-wide">Where the inefficiency lies</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{inefficiencyReasoning}</p>
          </div>
        </div>
        
        {/* Context Tags */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700/50">
           {event.context.injuries?.length ? (
             <span className="flex items-center space-x-1 text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded border border-orange-500/20">
               <AlertCircle size={12} />
               <span>Injury Impact</span>
             </span>
           ) : null}
           {event.context.motivationMismatch ? (
             <span className="flex items-center space-x-1 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
               <Zap size={12} />
               <span>Motivation Mismatch</span>
             </span>
           ) : null}
           {event.context.underlyingMetrics ? (
             <span className="flex items-center space-x-1 text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
               <Target size={12} />
               <span>Data Anomaly</span>
             </span>
           ) : null}
        </div>

        {/* Buttons Row */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-700/50">
           {sharpBreakdown && (
            <button 
              onClick={() => setIsSharpExpanded(!isSharpExpanded)}
              className="flex items-center justify-between bg-black/30 hover:bg-black/50 text-gray-300 px-4 py-3 rounded-lg border border-gray-700 transition"
            >
              <div className="font-bold uppercase tracking-wider text-xs">
                🔪 Sharp Breakdown
              </div>
              {isSharpExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
           )}

           {quantBreakdown && (
            <button 
              onClick={() => setIsQuantExpanded(!isQuantExpanded)}
              className="flex items-center justify-between bg-black/30 hover:bg-black/50 text-gray-300 px-4 py-3 rounded-lg border border-gray-700 transition"
            >
              <div className="font-bold uppercase tracking-wider text-xs">
                📊 Quant Table
              </div>
              {isQuantExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
           )}
        </div>

        {/* Expanded Sharp Breakdown */}
        {isSharpExpanded && sharpBreakdown && (
          <div className="mt-3 p-5 rounded-lg border-l-4 border-red-500 bg-black/40 space-y-4 shadow-inner">
            <div>
              <h5 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">True vs Market Probabilities</h5>
              <p className="text-slate-300 text-sm font-mono">{sharpBreakdown.trueProbStats}</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h5 className="text-red-400 text-xs uppercase font-bold tracking-widest mb-1">What Market Overvalues</h5>
                <p className="text-slate-400 text-sm leading-relaxed">{sharpBreakdown.overvalued}</p>
              </div>
              <div>
                <h5 className="text-emerald-400 text-xs uppercase font-bold tracking-widest mb-1">What Market Undervalues</h5>
                <p className="text-slate-400 text-sm leading-relaxed">{sharpBreakdown.undervalued}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800">
              <h5 className="text-orange-400 text-xs uppercase font-bold tracking-widest mb-1">Key Uncertainty Factor</h5>
              <p className="text-slate-400 text-sm leading-relaxed">{sharpBreakdown.uncertainty}</p>
            </div>
          </div>
        )}

        {/* Expanded Quant Breakdown */}
        {isQuantExpanded && quantBreakdown && (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/50 bg-black/40 shadow-inner">
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-gray-300">
                 <thead className="text-xs uppercase bg-gray-800/50 text-gray-400">
                   <tr>
                     <th className="px-4 py-3">Selection</th>
                     <th className="px-4 py-3 text-right">Odds</th>
                     <th className="px-4 py-3 text-right">Implied %</th>
                     <th className="px-4 py-3 text-right">Model %</th>
                     <th className="px-4 py-3 text-right">Edge (pp)</th>
                     <th className="px-4 py-3 text-right">EV</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-800 font-mono">
                   {quantBreakdown.outcomes.map((row, i) => (
                     <tr key={i} className="hover:bg-gray-800/20">
                       <td className="px-4 py-3 font-sans font-medium text-white">{row.selection}</td>
                       <td className="px-4 py-3 text-right">{row.odds.toFixed(2)}</td>
                       <td className="px-4 py-3 text-right">{row.impliedProb}%</td>
                       <td className="px-4 py-3 text-right text-indigo-300">{row.modelProb}%</td>
                       <td className={`px-4 py-3 text-right font-bold ${row.edge > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                         {row.edge > 0 ? '+' : ''}{row.edge}%
                       </td>
                       <td className={`px-4 py-3 text-right font-black ${row.ev > 0 ? 'text-emerald-400' : 'text-red-400/80'}`}>
                         {row.ev.toFixed(3)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             
             <div className="p-4 border-t border-slate-700/50 bg-slate-900/80 flex items-center justify-between">
               <div className="font-sans text-xs uppercase tracking-widest text-slate-400">Strategist Conclusion</div>
               <div className={`font-bold font-sans ${quantBreakdown.conclusion === "NO BET" ? "text-red-400" : "text-emerald-400"}`}>
                 {quantBreakdown.conclusion}
               </div>
             </div>
          </div>
        )}

        {/* Expanded Risk Manager */}
        {isQuantExpanded && quantBreakdown && quantBreakdown.conclusion !== "NO BET" && (
          <div className="mt-3 p-5 rounded-lg border border-indigo-500/30 bg-indigo-900/10 shadow-inner">
            <h4 className="text-indigo-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center space-x-2">
              <ShieldAlert size={16} />
              <span>Risk Management Protocol</span>
            </h4>
            
            <div className="space-y-4">
              {quantBreakdown.outcomes.filter(o => o.kellyPercentage > 0).map((o, idx) => {
                // Determine a simulated flat stake vs Kelly stake based on a 10,000 unit bankroll 
                const simulatedBankroll = 10000;
                let flatStakePct = 1.0;
                if (o.ev > 0.1) flatStakePct = 2.0;

                const suggestedStakeAmount = Math.round(simulatedBankroll * (o.kellyPercentage / 100));
                
                return (
                  <div key={idx} className="bg-black/40 p-4 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-white font-bold">{o.selection} Stake Profile</div>
                        <div className="text-slate-400 text-xs">Simulated Bankroll: {simulatedBankroll} SEK</div>
                      </div>
                      <div className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-500/30">
                        {o.kellyPercentage}% Kelly
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                        <div className="text-slate-500 text-xs uppercase mb-1">0.25 Fractional Kelly</div>
                        <div className="text-emerald-400 font-mono font-bold text-lg">{suggestedStakeAmount} SEK</div>
                        <div className="text-slate-400 text-xs">{o.kellyPercentage}% of Bankroll</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                        <div className="text-slate-500 text-xs uppercase mb-1">Flat Staking Model</div>
                        <div className="text-white font-mono font-bold text-lg">{Math.round(simulatedBankroll * (flatStakePct / 100))} SEK</div>
                        <div className="text-slate-400 text-xs">{flatStakePct}% of Bankroll</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3 flex items-start space-x-2">
                       <AlertCircle size={14} className="text-slate-500 shrink-0 mt-0.5" />
                       <span>
                         <strong>Risk Rule Applied: </strong>
                         {o.isRiskCapped 
                           ? "The core mathematical Kelly fraction exceeded safety limits. The Max 2% per-bet risk ceiling has been enforced to prevent unacceptable drawdown variance."
                           : "The recommended fraction sits cleanly under the 2% safety ceiling. A 0.25 Fractional multiplier is used to dampen standard volatility."}
                       </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
