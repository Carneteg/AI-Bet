import React from "react";
import { evaluateHistory, generateStrategistReport } from "@/lib/historyAnalyzer";
import { mockHistory } from "@/data/history";
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, Target, BrainCircuit, CheckSquare, XSquare, FlaskConical } from "lucide-react";

export default function TrackerDashboard() {
  const analysis = evaluateHistory(mockHistory);
  const strategistReport = generateStrategistReport(analysis);

  return (
    <main className="min-h-screen bg-[#0a0f16] text-slate-300 py-12">
      <div className="max-w-5xl mx-auto px-4">
        
        <header className="mb-10 border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-black text-white flex items-center space-x-3 mb-2">
            <span>📈 Performance Analyst</span>
          </h1>
          <p className="text-slate-400 text-lg">Closing Line Value (CLV) evaluation and root cause logic.</p>
        </header>

        {/* --- MACRO STRATEGIST AGGREGATE --- */}
        {strategistReport && (
          <div className="mb-12 border border-purple-500/30 bg-purple-900/10 rounded-2xl shadow-2xl overflow-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="p-6 border-b border-slate-800/80">
               <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                 <BrainCircuit className="text-purple-400" />
                 <span>7-Day AI Strategist Review</span>
               </h2>
               <p className="text-slate-400 text-sm mt-1">Aggregated macro-performance across {strategistReport.metrics.totalBets} tracked bets.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800/50">
              <div className="p-6 text-center">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Raw Hit Rate</div>
                <div className="text-3xl font-black text-white">{strategistReport.metrics.hitRate}%</div>
              </div>
              <div className="p-6 text-center">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Standard ROI</div>
                <div className={`text-3xl font-black ${strategistReport.metrics.roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {strategistReport.metrics.roi > 0 ? '+' : ''}{strategistReport.metrics.roi}%
                </div>
              </div>
              <div className="p-6 text-center">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">CLV Beat Rate</div>
                <div className="text-3xl font-black text-indigo-400">{strategistReport.metrics.clvBeatRate}%</div>
              </div>
              <div className="p-6 text-center">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Avg Edge (EV)</div>
                <div className="text-3xl font-black text-white">{strategistReport.metrics.avgEv}%</div>
              </div>
            </div>

            {/* Strategic Output */}
            <div className="bg-black/30 p-6 grid md:grid-cols-3 gap-6">
               <div>
                  <h4 className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-sm mb-2">
                    <CheckSquare size={16} /> <span>Keep Doing</span>
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{strategistReport.actionable.keepDoing}</p>
               </div>
               <div>
                  <h4 className="flex items-center space-x-2 text-red-400 font-bold uppercase tracking-wider text-sm mb-2">
                    <XSquare size={16} /> <span>Stop Doing</span>
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{strategistReport.actionable.stopDoing}</p>
               </div>
               <div>
                  <h4 className="flex items-center space-x-2 text-orange-400 font-bold uppercase tracking-wider text-sm mb-2">
                    <FlaskConical size={16} /> <span>Test Next</span>
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{strategistReport.actionable.testNext}</p>
               </div>
            </div>
          </div>
        )}

        {/* --- MICRO BET EVALUATIONS --- */}
        <h3 className="text-xl font-bold text-white mb-6">Individual Bet Ledger</h3>        <div className="space-y-6">
          {analysis.map((item, idx) => {
            const isGoodBet = item.grade === "Good Bet";
            const borderColor = isGoodBet ? "border-emerald-500/30" : "border-red-500/30";
            
            return (
              <div key={item.bet.id} className={`bg-slate-900 border ${borderColor} rounded-xl p-6 shadow-xl`}>
                
                {/* Header block */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                      <span>{item.bet.date}</span>
                      <span>•</span>
                      <span className="uppercase">{item.bet.matchName}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Backed: {item.bet.selection}</h3>
                  </div>
                  
                  {/* Result & Grade badges */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className={`px-3 py-1 rounded font-bold text-sm border ${item.bet.result === "WIN" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                      RESULT: {item.bet.result}
                    </div>
                    <div className={`flex items-center space-x-1 font-bold uppercase tracking-widest text-xs ${isGoodBet ? "text-emerald-400" : "text-red-400"}`}>
                      {isGoodBet ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>{item.grade}</span>
                    </div>
                  </div>
                </div>

                {/* CLV Math */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/30 rounded p-3 text-center border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase mb-1">Odds Taken</div>
                    <div className="font-mono text-xl text-white font-bold">{item.bet.oddsTaken.toFixed(2)}</div>
                  </div>
                  <div className="flex justify-center items-center text-slate-600">
                    {item.beatClosingLine ? <TrendingDown size={30} className="text-emerald-500/50" /> : <TrendingUp size={30} className="text-red-500/50" />}
                  </div>
                  <div className="bg-black/30 rounded p-3 text-center border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase mb-1">Closing Odds</div>
                    <div className="font-mono text-xl text-white font-bold">{item.bet.closingOdds.toFixed(2)}</div>
                  </div>
                </div>

                {/* Analyst Diagnosis */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center space-x-2">
                    <Target size={14} />
                    <span>Analyst Breakdown</span>
                  </h4>
                  
                  <div className="mb-4">
                     <span className="font-bold text-slate-300">Root Cause: </span>
                     <span className={`font-semibold ${item.rootCause.includes("Variance") ? "text-orange-400" : (item.rootCause.includes("Solid") ? "text-emerald-400" : "text-red-400")}`}>
                       {item.rootCause}
                     </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-black/20 p-3 rounded border-l-2 border-indigo-500 text-sm">
                      <span className="font-bold text-indigo-400 block mb-1">KEY LESSON</span>
                      <p className="text-slate-300 leading-relaxed">{item.keyLesson}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded border-l-2 border-orange-500 text-sm">
                      <span className="font-bold text-orange-400 block mb-1">FUTURE ADJUSTMENT</span>
                      <p className="text-slate-300 leading-relaxed">{item.adjustment}</p>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
