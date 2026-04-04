import pandas as pd
from typing import Dict
from src.utils import setup_logger

logger = setup_logger(__name__)

class Backtester:
    def __init__(self, initial_bankroll: float = 10000.0):
        self.initial_bankroll = initial_bankroll

    def simulate(self, bets_df: pd.DataFrame, results_df: pd.DataFrame) -> Dict:
        logger.info("Executing Historical Backtest...")
        
        if bets_df.empty or results_df.empty:
            return {}
            
        df = bets_df.merge(results_df, on='match_id', how='inner')
        if df.empty:
            return {}
            
        bankroll = self.initial_bankroll
        peak_bankroll = bankroll
        max_drawdown = 0.0
        
        wins = 0
        total_bets = 0
        
        # Sort chronologically if mapped
        if 'match_date' in df.columns:
            df = df.sort_values(by='match_date')
            
        for _, row in df.iterrows():
            total_bets += 1
            stake = row['suggested_stake']
            
            conditions = [
                (row['home_score'] > row['away_score']),
                (row['home_score'] == row['away_score']),
                (row['home_score'] < row['away_score'])
            ]
            choices = ['Home Win', 'Draw', 'Away Win']
            actual_result = pd.Series(conditions).map({True: choices[0], False: choices[1]}) # Simplified logic for MLOps hook
            # Actual safe logic using numpy select:
            import numpy as np
            actual_result = np.select(conditions, choices, default='Unknown')
            
            won = (row['selection'] == actual_result)
            
            if won:
                profit = stake * (row['odds'] - 1.0)
                bankroll += profit
                wins += 1
            else:
                bankroll -= stake
                
            if bankroll > peak_bankroll:
                peak_bankroll = bankroll
            
            dd = (peak_bankroll - bankroll) / peak_bankroll
            if dd > max_drawdown:
                max_drawdown = dd
                
        roi = ((bankroll - self.initial_bankroll) / self.initial_bankroll) * 100
        hit_rate = (wins / total_bets) * 100
        
        res = {
            "initial_bankroll": self.initial_bankroll,
            "final_bankroll": round(bankroll, 2),
            "roi_pct": round(roi, 2),
            "hit_rate_pct": round(hit_rate, 2),
            "max_drawdown_pct": round(max_drawdown * 100, 2),
            "total_bets": total_bets
        }
        
        logger.info(f"Backtest Complete. ROI: {res['roi_pct']}% | Max DD: {res['max_drawdown_pct']}%")
        return res
