import os
import json
from datetime import datetime

class ReportGenerator:
    def __init__(self, out_dir="reports"):
        self.out_dir = out_dir
        os.makedirs(self.out_dir, exist_ok=True)

    def build(self, eval_data: dict, drift_data: dict, arena_status: str, version: str):
        date_str = datetime.now().strftime("%Y-%m-%d_%H%M")
        
        md = f"# Unified System Debrief - {date_str}\n\n"
        md += f"## Evaluation\nHit Rate: {eval_data.get('hit_rate', 0)*100:.1f}%\n"
        md += f"Home Brier: {eval_data.get('brier_score_home', 0):.4f}\n\n"
        
        md += "## Drift Watch\n"
        if drift_data.get('drift_detected'):
            for w in drift_data['warnings']:
                md += f"- ⚠️ {w}\n"
        else:
            md += "✅ No drift detected.\n"
            
        md += f"\n## Active Loop Action\nResult: {arena_status}\nCurrent Core Version: {version}\n"
        
        md_path = os.path.join(self.out_dir, f"loop_{date_str}.md")
        with open(md_path, 'w') as f: f.write(md)
        return md_path
