import React from "react";
import { mockRaces } from "@/data/racingMock";
import { analyzeRacingCard } from "@/lib/racingAnalyzer";
import { Flag, Activity, EyeOff, Navigation, TrendingDown } from "lucide-react";

export const metadata = {
  title: "Horse Racing Analyst | StryktipsAI",
  description: "Scanning racing cards for pace meltdowns and insider drift.",
};

export default function RacingDashboard() {
  const topScenarios = analyzeRacingCard(mockRaces);

  return (
    <main className="min-h-screen bg-[#0a0f16] py-12 px-4 md:px-0 mt-16 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4 flex items-center justify-center space-x-3">
            <Flag className="text-amber-400" size={40} />
            <span>Racing Analyst</span>
          </h1>
          <p className="text-slate-400 text-lg">Exploiting pace dynamics, dark horses, and sharp money.</p>
        </header>

        {/* --- TOP 3 STRATEGIC SCENARIOS WIDGET --- */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Today's Premium Value Angles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {topScenarios.map((scenario, idx) => {
              
              // Icon Selection based on type
              let Icon = Activity;
              let color = "text-emerald-400";
              let bg = "bg-emerald-400/10";
              let border = "border-emerald-400/30";
              
              if (scenario.type === "Insider Drift") {
                Icon = TrendingDown;
                color = "text-purple-400";
                bg = "bg-purple-400/10";
                border = "border-purple-400/30";
              } else if (scenario.type === "Pace Meltdown") {
                Icon = Navigation;
                color = "text-orange-400";
                bg = "bg-orange-400/10";
                border = "border-orange-400/30";
              } else if (scenario.type === "Hidden Form") {
                Icon = EyeOff;
                color = "text-cyan-400";
                bg = "bg-cyan-400/10";
                border = "border-cyan-400/30";
              }

              return (
                <div key={idx} className={`relative p-6 rounded-2xl border ${border} ${bg} overflow-hidden shadow-xl`}>
                   <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
                     <Icon size={120} />
                   </div>
                   
                   <div className="relative z-10">
                     <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 ${color} border ${border} uppercase tracking-widest`}>
                       {scenario.type}
                     </span>
                     <h3 className="text-xl font-bold text-white mb-1">{scenario.targetHorse}</h3>
                     <p className="text-slate-400 text-xs mb-4">Targeting: {mockRaces.find(r => r.id === scenario.raceId)?.track} {mockRaces.find(r => r.id === scenario.raceId)?.distance}</p>
                     
                     <div className="bg-black/40 p-4 rounded-lg border border-slate-800/50">
                       <p className="text-slate-300 text-sm leading-relaxed">
                         {scenario.description}
                       </p>
                     </div>
                   </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- RAW CARD DATA --- */}
        <div>
           <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Full Scan Ledger</h2>
           <div className="space-y-6">
              {mockRaces.map((race) => (
                <div key={race.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-800/50 p-4 flex justify-between items-center">
                    <h3 className="font-bold text-white font-serif">{race.track} • {race.time}</h3>
                    <span className="text-slate-400 text-sm">{race.distance}</span>
                  </div>
                  
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/20 text-slate-500 text-xs uppercase tracking-widest">
                          <th className="p-4 font-medium">Horse / Trainer</th>
                          <th className="p-4 font-medium">Pace Style</th>
                          <th className="p-4 font-medium text-right">Opening</th>
                          <th className="p-4 font-medium text-right">Current</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {race.horses.map(horse => (
                          <tr key={horse.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-4">
                              <div className="text-white font-bold">{horse.name}</div>
                              <div className="text-slate-500 text-xs">{horse.trainer}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs border ${horse.paceStyle === 'Frontrunner' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : horse.paceStyle === 'Closer' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                {horse.paceStyle}
                              </span>
                              {horse.hasHiddenForm && (
                                <span className="ml-2 px-2 py-1 rounded text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20" title="Hidden Form Identified">
                                  👁️ Form
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right text-slate-400 font-mono">{horse.openingOdds.toFixed(1)}</td>
                            <td className={`p-4 text-right font-mono font-bold ${horse.currentOdds < horse.openingOdds ? 'text-emerald-400' : horse.currentOdds > horse.openingOdds ? 'text-red-400' : 'text-slate-300'}`}>
                              {horse.currentOdds.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </main>
  );
}
