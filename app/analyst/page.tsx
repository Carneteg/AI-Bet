import { analyzeMarkets, analyzeSlate } from "@/lib/analyzer";
import { OpportunityCard } from "@/components/OpportunityCard";
import { fetchLiveMatches } from "@/lib/footballData";
import { matches as fallbackMatches } from "@/data/matches";
import { Telescope, Crosshair, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "AI Market Analyst | StryktipsAI",
  description: "Scanning live odds for market inefficiencies and hidden value.",
};

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export default async function AnalystDashboard() {
  const live = await fetchLiveMatches(false);
  const rawMatches = (live && live.length > 0) ? live : fallbackMatches;
  
  const opportunities = analyzeMarkets(rawMatches).slice(0, 5); // Take top 5
  const slateAngles = analyzeSlate(rawMatches); // Get active top 3 angles for today

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
          Current Market <span className="text-emerald-400">Inefficiencies</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mb-6">
          Our AI scans live odds, injury reports, and betting volume to find spots 
          where the public has skewed the implied probability away from the true probability. 
          We attack the market, not the sport.
        </p>

        {/* Professional Slate Overview Widget */}
        {slateAngles.length > 0 && (
          <div className="mb-12 border border-slate-700 bg-slate-900/50 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-black text-white flex items-center space-x-2 mb-6">
              <Telescope className="text-emerald-400" />
              <span>Professional Analyst Slate Preview</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {slateAngles.map((angle, idx) => (
                <div key={idx} className="bg-black/40 border border-slate-800 rounded-lg p-5">
                   <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-start space-x-2">
                     <span className="text-slate-600">0{idx + 1}</span>
                     <span>{angle.title}</span>
                   </h3>
                   <p className="text-slate-400 text-sm leading-relaxed mb-4">
                     {angle.description}
                   </p>
                   {angle.applicableMatches.length > 0 && (
                     <div className="border-t border-slate-800 pt-3">
                       <span className="text-xs text-slate-500 uppercase tracking-widest block mb-2">Applicable Targets</span>
                       <ul className="space-y-1">
                         {angle.applicableMatches.map((m, i) => (
                           <li key={i} className="text-xs text-slate-300 flex items-center space-x-1">
                             <Crosshair size={12} className="text-slate-600" />
                             <span className="truncate">{m}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-200 p-4 rounded-xl flex items-start space-x-3 mb-8 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
          <ShieldAlert className="text-orange-400 mt-1" size={20} />
          <div className="text-sm leading-relaxed">
            <strong className="text-orange-400 font-bold block mb-1">Analyst Note</strong>
            This dashboard highlights where value *might* exist based on fundamental odds disconnects. It is not financial advice. Betting tips should only be executed alongside a strict Kelly Criterion bankroll strategy.
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {opportunities.map((opp, index) => (
          <OpportunityCard key={opp.eventId} opportunity={opp} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
