import pandas as pd
from typing import List, Dict
from src.utils import setup_logger
from src.betting.decision_engine import DecisionEngine
from src.betting.scorecard import BetScorecard
from src.betting.risk import RiskManager
from src.betting.portfolio import PortfolioManager

logger = setup_logger(__name__)

class BettingEngine:
    def __init__(self, bankroll: float):
        self.bankroll = bankroll
        self.decision_engine = DecisionEngine()
        self.scorecard = BetScorecard()
        self.risk_manager = RiskManager()
        self.portfolio_manager = PortfolioManager()

    def _determine_best_outcome(self, row) -> dict:
        outcomes = []
        
        # ----------------------------------------------------
        # NEW RULE: Draw Avoidance in Low-Scoring Leagues 
        # (Meaning: Penalize Outright Draws when implied goal averages are high > 2.7)
        # ----------------------------------------------------
        draw_prob_adj = row['draw_prob']
        if row.get('league_avg_goals', 2.5) > 2.7:
            draw_prob_adj = draw_prob_adj * 0.95  # Manually deduct 5% probability

        def evaluate_side(odds_key, prob_val, selection_name):
            if odds_key in row:
                base_decision = self.decision_engine.evaluate_bet(
                    model_probability=prob_val,
                    odds=row[odds_key],
                    confidence_score=row.get('confidence', 0.60),
                    data_quality_score=row.get('data_quality', 0.95),
                    segment_roi=row.get('segment_roi', 0.05),
                    current_exposure=0.0
                )
                
                if base_decision['decision'] in ["BET", "SMALL_BET"]:
                    grade = self.scorecard.grade(
                        ev=base_decision['ev'],
                        confidence=row.get('confidence', 0.60),
                        clv_signal=row.get('clv_signal', 0.0),
                        lineup_confirmed=row.get('lineup_confirmed', False),
                        public_bias=row.get('public_bias', False),
                        data_quality=row.get('data_quality', 0.95),
                        odds_movement=row.get('odds_movement', 0.0),
                        uncertainty_flag=row.get('uncertainty_flag', False)
                    )
                    
                    if grade['classification'] != "PASS":
                        outcomes.append({
                            "selection": selection_name,
                            "odds": row[odds_key],
                            "model_prob": prob_val,
                            "ev": base_decision['ev'],
                            "edge": base_decision['edge'],
                            "classification": grade['classification'],
                            "score": grade['total_score']
                        })

        if 'home_win_prob' in row: evaluate_side('home_odds', row['home_win_prob'], 'Home Win')
        if 'draw_prob' in row: evaluate_side('draw_odds', draw_prob_adj, 'Draw')
        if 'away_win_prob' in row: evaluate_side('away_odds', row['away_win_prob'], 'Away Win')

        if not outcomes:
            return {}
            
        return max(outcomes, key=lambda x: x['score'])

    def run(self, df_preds: pd.DataFrame, df_odds: pd.DataFrame) -> List[Dict]:
        logger.info(f"Initiating Quantitative Engine on bankroll: ${self.bankroll}")
        
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
                
                # Dynamic Stake Modifier based on Scorecard Classification
                modifiers = {"HIGH": 1.0, "MEDIUM": 0.6, "LOW": 0.25}
                adjusted_stake = round(stake * modifiers.get(best_edge['classification'], 1.0), 2)
                
                if adjusted_stake > 0:
                    raw_bets.append({
                        "match_id": row['match_id'],
                        "home_team": row['home_team'],
                        "away_team": row['away_team'],
                        "selection": best_edge['selection'],
                        "odds": best_edge['odds'],
                        "model_prob": best_edge['model_prob'],
                        "ev": best_edge['ev'],
                        "scorecard_grade": best_edge['classification'],
                        "suggested_stake": adjusted_stake
                    })
                    
        approved_slate = self.portfolio_manager.optimize_slate(raw_bets, self.bankroll)
        logger.info(f"Engine identified {len(raw_bets)} raw edges. Portfolio constraint approved {len(approved_slate)}.")
        return approved_slate
