import os
import json
from datetime import datetime

class ReportGenerator:
    def __init__(self, output_dir="reports"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate(self, eval_metrics: dict, drift_results: dict, arena_result: str, champion_version: str):
        date_str = datetime.now().strftime("%Y-%m-%d_%H%M")
        
        md_content = f"""# AI Betting Loop Report - {datetime.now().strftime('%Y-%m-%d')}

## 1. Historical Calibration
- **Matches Reconciled:** {eval_metrics.get('total_matches_reviewed', 0)}
- **Agent Hit Rate:** {eval_metrics.get('hit_rate', 0)*100:.1f}%
- **Champion Brier Score:** {eval_metrics.get('brier_score_home', 0):.4f}

## 2. Feature Drift Analysis
**Status:** {'⚠️ DRIFT DETECTED' if drift_results.get('drift_detected') else '✅ Stable'}
"""
        if drift_results.get('warnings'):
            for w in drift_results['warnings']:
                md_content += f"- {w}\n"
        else:
            md_content += "\nNo significant mathematical shifts observed in the data.\n"

        md_content += f"""
## 3. The Arena Action
**Result:** {arena_result}
**Active Champion Model Version:** {champion_version}
"""
        
        # Save Markdown
        md_path = os.path.join(self.output_dir, f"loop_report_{date_str}.md")
        with open(md_path, 'w') as f:
            f.write(md_content)
        
        # Save JSON data dump
        json_payload = {
            'timestamp': datetime.now().isoformat(),
            'evaluation': eval_metrics,
            'drift': drift_results,
            'arena': arena_result,
            'champion_active': champion_version
        }
        json_path = os.path.join(self.output_dir, f"loop_data_{date_str}.json")
        with open(json_path, 'w') as f:
            json.dump(json_payload, f, indent=4)
            
        return md_path
