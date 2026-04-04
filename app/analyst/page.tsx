import fs from 'fs';
import path from 'path';
import { Telescope, Crosshair, ShieldAlert, BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Professional Analyst Dashboard | AI-Bet",
  description: "Real-time quantitative analysis from the Python Monolith.",
};

export const dynamic = 'force-dynamic';
// Disable caching for this dynamic page to ensure real-time analysis updates
export const revalidate = 0;

async function getLatestAnalysis() {
  const filePath = path.join(process.cwd(), 'app', 'data', 'latest_analysis.json');
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading analysis data:", error);
  }
  return null;
}

export default async function AnalystDashboard() {
  const data = await getLatestAnalysis();
  
  if (!data || !data.analysis || data.analysis.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Analyst Offline</h1>
        <p className="text-slate-400">Run <code className="bg-slate-800 px-2 py-1 rounded text-emerald-400">daily_assistant.py</code> to generate your first report.</p>
      </div>
    );
  }

  const { analysis, coupons, pass_list, summary, timestamp } = data;
  const dateStr = new Date(timestamp).toLocaleString('sv-SE', { 
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12">
      {/* Header & Meta */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Quantitative Feed
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">
            Execution <span className="text-emerald-400 font-extrabold italic">Ledger</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
             Disciplined Poisson-Kelly auditing of today's markets.
          </p>
        </div>
        <div className="text-right">
          <div className="text-slate-500 text-xs uppercase tracking-widest mb-1">Last Analysis Update</div>
          <div className="text-white font-mono font-medium">{dateStr}</div>
        </div>
      </div>

      {/* Table 1: Match Analysis (Premium Glassmorphic) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-lg px-2">
          <Crosshair className="text-emerald-400" size={20} />
          <h2>Table 1: Professional Market Scanning</h2>
        </div>
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Match</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Pick</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Prob</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Edge</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">EV</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Grade</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Stake</th>
              </tr>
            </thead>
            <tbody>
              {analysis.map((row: any, i: number) => (
                <tr key={i} className="border-t border-slate-800/50 hover:bg-emerald-500/[0.03] transition">
                  <td className="p-4 font-bold text-white whitespace-nowrap">{row.Match}</td>
                  <td className="p-4 text-center">
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg font-black text-sm border border-emerald-500/30">
                      {row['Rec. Pick']}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-slate-300">{row.Prob}</td>
                  <td className="p-4 text-center font-mono text-emerald-400 font-bold">{row.Edge}</td>
                  <td className="p-4 text-center font-mono text-emerald-400">{row.EV}</td>
                  <td className="p-4 text-center">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm border ${
                      row['Conf Class'] === 'HIGH' ? 'bg-emerald-500 text-black border-emerald-400' :
                      row['Conf Class'] === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                      'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      {row['Conf Class']}
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-white whitespace-nowrap">{row.Stake}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Table 2: Coupon Suggestion (Dynamic Cards) */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg px-2">
            <BarChart3 className="text-brand" size={20} />
            <h2>Table 2: Portfolio Strategies</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {['Safe', 'Balanced', 'Aggressive'].map((tier) => {
              const item = coupons.find((c: any) => c.Product === "Pool System");
              return (
                <div key={tier} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-brand/40 transition">
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{tier}</div>
                  <div className="text-white font-mono break-words leading-tight text-sm">
                    {item ? item[tier] : "---"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table 3: Pass List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg px-2">
            <AlertTriangle className="text-orange-400" size={20} />
            <h2>Table 3: Discipline (The Pass List)</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            {pass_list.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-slate-800/50 pb-2 last:border-0">
                <span className="font-bold text-slate-300">{item.Match}</span>
                <span className="text-slate-500 text-xs italic">{item['Reason for no bet']}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table 4: Daily Summary (Coach Notes) */}
      <section className="bg-brand/5 border border-brand/20 rounded-3xl p-8 relative overflow-hidden">
         <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <TrendingUp size={200} className="text-brand" />
         </div>
         <div className="flex items-center gap-2 text-brand font-black text-xl mb-6">
            <CheckCircle2 size={24} />
            <h2>Table 4: System Insight & Coaching</h2>
         </div>
         <div className="grid md:grid-cols-2 gap-6 relative z-10">
            {summary.map((note: string, i: number) => (
              <div key={i} className="flex gap-3 text-slate-300 leading-relaxed">
                <span className="text-brand font-black mt-1">→</span>
                <p className="text-sm font-medium">{note}</p>
              </div>
            ))}
         </div>
         
         {/* Risk Warning Disclaimer */}
         <div className="mt-8 pt-8 border-t border-brand/10 text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-4">
            <ShieldAlert size={14} className="text-orange-500/50" />
            <span>Quantitative strategies only build edge over sample sizes (N &gt; 100). Protect bankroll today.</span>
         </div>
      </section>
    </div>
  );
}
