from typing import List, Dict
import pandas as pd

class MarkdownFormatter:
    def format_match_analysis(self, matches: List[Dict], product_name: str) -> str:
        md = f"### Table 1: Match-by-match analysis ({product_name})\n\n"
        md += "| Match | Best Sign | Action | Confidence | Probabilities (1/X/2) | Streck % | Stake (u) | Reason |\n"
        md += "|---|---|---|---|---|---|---|---|\n"
        
        for m in matches:
            match_name = f"{m.get('home', 'Home')} vs {m.get('away', 'Away')}"
            probs = f"{m.get('prob_1', 0)*100:.0f} / {m.get('prob_X', 0)*100:.0f} / {m.get('prob_2', 0)*100:.0f}"
            streck = f"{m.get('streck_1', 0)*100:.0f} / {m.get('streck_X', 0)*100:.0f} / {m.get('streck_2', 0)*100:.0f}"
            
            md += f"| {match_name} | {m['sign']} | {m['action']} | {m['confidence']} | {probs} | {streck} | {m.get('stake', 0.0)}u | {m['reason']} |\n"
        
        return md

    def format_system_recommendation(self, matches: List[Dict], product_name: str) -> str:
        md = f"\n### Table 2: Final System Recommendation ({product_name})\n\n"
        
        # Calculate structure
        spikar = [m for m in matches if m['action'] == 'Spik']
        halv = [m for m in matches if m['action'] == 'Halv']
        hel = [m for m in matches if m['action'] == 'Hel']
        
        md += "| Safe Version | Balanced Version | Aggressive Version | Notes |\n"
        md += "|---|---|---|---|\n"
        md += f"| {len(spikar)+len(halv)} Spikar, {len(hel)} Halv | {len(spikar)} Spik, {len(halv)} Halv, {len(hel)} Hel | U-system relying on {len(spikar)} raw anchors | Strict math applied |\n\n"
        
        md += "**System Summary:**\n"
        md += f"- **Strongest Anchor:** {spikar[0]['home'] + ' vs ' + spikar[0]['away'] if spikar else 'None'}\n"
        md += f"- **Biggest Public Trap:** {hel[0]['home'] + ' vs ' + hel[0]['away'] if hel else 'None'}\n"
        
        return md

    def format_bankroll(self, matches: List[Dict], product_name: str) -> str:
        total_units = sum(m.get('stake', 0.0) for m in matches)
        # Bankroll specific logic limits at 5% total exposure 
        exposure_cap = min(total_units, 5.0) 
        
        md = f"\n### Table 3: Bankroll allocation ({product_name})\n\n"
        md += "| Number of Selections | Total Units Risked | Max Exposure % | Suggested Stake Plan |\n"
        md += "|---|---|---|---|\n"
        md += f"| {len(matches)} | {total_units}u | {exposure_cap}% | Reduce individual stakes evenly if > 5.0u |\n"
        
        return md

    def format_pass_list(self, matches: List[Dict]) -> str:
        md = "\n### Table 4: Pass list\n\n"
        md += "| Match | Why no bet / no edge |\n"
        md += "|---|---|\n"
        
        pass_matches = [m for m in matches if m.get('confidence') == 'Very Low']
        
        if not pass_matches:
            md += "| None | All games exhibited playable EV structure |\n"
        else:
            for m in pass_matches:
               match_name = f"{m.get('home', 'Home')} vs {m.get('away', 'Away')}"
               md += f"| {match_name} | {m['reason']} |\n"
               
        return md
