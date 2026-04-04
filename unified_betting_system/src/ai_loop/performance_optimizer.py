import pandas as pd
from typing import Dict, Any, List
from src.utils import setup_logger

logger = setup_logger(__name__)

class PerformanceOptimizer:
    def __init__(self, min_sample_size: int = 50):
        self.min_sample_size = min_sample_size

    def analyze(self, bet_logs_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyzes historical quantitative betting logs to output structural 
        threshold recommendations and segment targeting.
        """
        logger.info("Initializing quantitative performance optimization audit...")
        
        if bet_logs_df is None or len(bet_logs_df) < self.min_sample_size:
            logger.warning(f"Insufficient sample size for algorithmic optimization (N={len(bet_logs_df) if bet_logs_df is not None else 0}). Recommendation: Gather more data.")
            return self._build_empty_recommendation()

        # Assuming bet_logs_df contains ['decision', 'ev', 'edge', 'confidence', 'bet_won', 'clv_beaten', 'segment_id']
        
        # 1. Evaluate "Too Strict" rules
        # Look for bets that were marked 'PASS' because they barely missed the threshold, but ultimately beat the closing line.
        passes_df = bet_logs_df[bet_logs_df['decision'] == 'PASS']
        too_strict = []
        if not passes_df.empty and 'clv_beaten' in passes_df.columns:
            marginal_edge_passes = passes_df[(passes_df['edge'] >= 0.03) & (passes_df['edge'] < 0.04)]
            if not marginal_edge_passes.empty:
                marginal_clv_win_rate = marginal_edge_passes['clv_beaten'].mean()
                if marginal_clv_win_rate > 0.55: # If they beat the closing line > 55% of the time
                    too_strict.append("Edge threshold (0.04) is too strict. Marginal edge group (0.03-0.04) achieved positive CLV generation.")

        # 2. Evaluate "Too Loose" rules
        # Look for bets placed that bled capital
        placed_df = bet_logs_df[bet_logs_df['decision'].isin(['BET', 'SMALL_BET'])]
        too_loose = []
        if not placed_df.empty:
            low_conf_bets = placed_df[(placed_df['confidence'] >= 0.58) & (placed_df['confidence'] <= 0.62)]
            if not low_conf_bets.empty and 'bet_won' in low_conf_bets.columns:
                if low_conf_bets['bet_won'].mean() < 0.45: # If hit rate is disastrously low for medium confidence
                    too_loose.append("Confidence threshold (0.58) is too loose. Bets under 0.62 have consistently negative strike rates.")
                    
            if 'clv_beaten' in placed_df.columns:
                low_ev_bets = placed_df[(placed_df['ev'] >= 0.03) & (placed_df['ev'] <= 0.05)]
                if not low_ev_bets.empty and low_ev_bets['clv_beaten'].mean() < 0.40:
                    too_loose.append("EV floor (0.03) is bleeding CLV. Strongly consider raising baseline EV to 0.05.")

        # 3. Segments (Leagues/Divisions) Focus/Remove
        segments_to_remove = []
        segments_to_focus = []
        if 'segment_id' in bet_logs_df.columns and 'bet_won' in bet_logs_df.columns: # Assuming standard profit proxy
            segment_group = placed_df.groupby('segment_id').agg(
                bets=('bet_won', 'count'),
                win_rate=('bet_won', 'mean'),
                avg_ev=('ev', 'mean')
            ).reset_index()
            
            # Require minimum sample size per segment to make a call
            valid_segments = segment_group[segment_group['bets'] >= (self.min_sample_size / 5)]
            
            for _, row in valid_segments.iterrows():
                if row['win_rate'] < 0.40:
                    segments_to_remove.append(row['segment_id'])
                elif row['win_rate'] > 0.60 and row['avg_ev'] > 0.05:
                    segments_to_focus.append(row['segment_id'])

        # 4. Suggested Actionable Thresholds
        new_thresholds = {
            "suggested_min_edge": 0.03 if len(too_strict) > 0 else 0.04,
            "suggested_min_confidence": 0.62 if any("Confidence" in x for x in too_loose) else 0.58,
            "suggested_min_ev": 0.05 if any("EV floor" in x for x in too_loose) else 0.03
        }

        return {
            "too_strict_rules": too_strict if too_strict else ["Current constraints appear mathematically sound."],
            "too_loose_rules": too_loose if too_loose else ["No obvious capital bleed detected in approved thresholds."],
            "suggested_thresholds": new_thresholds,
            "segments_to_remove": segments_to_remove,
            "segments_to_focus": segments_to_focus
        }

    def _build_empty_recommendation(self) -> Dict[str, Any]:
        return {
            "too_strict_rules": [],
            "too_loose_rules": [],
            "suggested_thresholds": {},
            "segments_to_remove": [],
            "segments_to_focus": []
        }
