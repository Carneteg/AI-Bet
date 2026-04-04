import pandas as pd
from typing import List, Dict
from src.utils import setup_logger
from src.betting.value import ValueDetector
from src.betting.risk import RiskManager
from src.betting.portfolio import PortfolioManager

logger = setup_logger(__name__)

class BettingEngine:
    def __init__(self, bankroll: float):
        self.bankroll = bankroll
        self.value_detector = ValueDetector()
        self.risk_manager = RiskManager()
        self.portfolio_manager = PortfolioManager()

    def _determine_best_outcome(self, row) -> dict:
        outcomes = []
        if 'home_odds' in row and 'home_win_prob' in row:
            v_home = self.value_detector.evaluate(row['home_odds'], row['home_win_prob'])
            if v_home: outcomes.append({"selection": "Home Win", **v_home})
            
        if 'draw_odds' in row and 'draw_prob' in row:
            v_draw = self.value_detector.evaluate(row['draw_odds'], row['draw_prob'])
            if v_draw: outcomes.append({"selection": "Draw", **v_draw})
            
        if 'away_odds' in row and 'away_win_prob' in row:
            v_away = self.value_detector.evaluate(row['away_odds'], row['away_win_prob'])
            if v_away: outcomes.append({"selection": "Away Win", **v_away})

        if not outcomes:
            return {}
            
        return max(outcomes, key=lambda x: x['ev'])

    def run(self, df_preds: pd.DataFrame, df_odds: pd.DataFrame) -> List[Dict]:
        logger.info(f"Initiating Engine on bankroll: ${self.bankroll}")
        
        df = df_preds.merge(df_odds, on='match_id', how='inner')
        if df.empty:
            logger.warning("No matches with correlating odds found.")
            return []

        raw_bets = []
        for _, row in df.iterrows():
            best_edge = self._determine_best_outcome(row)
            if best_edge:
                stake = self.risk_manager.calculate_stake(
                    best_edge['model_prob'], best_edge['odds'], self.bankroll
                )
                if stake > 0:
                    raw_bets.append({
                        "match_id": row['match_id'],
                        "home_team": row['home_team'],
                        "away_team": row['away_team'],
                        "selection": best_edge['selection'],
                        "odds": best_edge['odds'],
                        "model_prob": best_edge['model_prob'],
                        "ev": best_edge['ev'],
                        "suggested_stake": stake
                    })
                    
        approved_slate = self.portfolio_manager.optimize_slate(raw_bets, self.bankroll)
        logger.info(f"Engine identified {len(raw_bets)} raw edges. Portfolio constraint approved {len(approved_slate)}.")
        return approved_slate
