import pandas as pd
import logging
from .value import evaluate_value
from .risk import RiskManager

logger = logging.getLogger(__name__)

class BetEngine:
    def __init__(self, risk_manager: RiskManager, min_ev: float = 0.03):
        self.risk_manager = risk_manager
        self.min_ev = min_ev

    def evaluate_match_outcomes(self, match_id: str, teams: str, probabilities: dict, odds: dict) -> dict:
        """
        Scans all 3 match outcomes (Home, Draw, Away). 
        Finds the outcome with the mathematically highest EV.
        Determines exact monetary stake if the EV crosses the minimum threshold.
        """
        candidates = []
        
        # Test Home Win
        val_home = evaluate_value(probabilities['home_win'], odds['home_win'], self.min_ev)
        if val_home['is_value']:
            candidates.append({
                'selection': 'Home Win', 'prob': probabilities['home_win'], 'odd': odds['home_win'], 'metrics': val_home
            })
            
        # Test Draw
        val_draw = evaluate_value(probabilities['draw'], odds['draw'], self.min_ev)
        if val_draw['is_value']:
            candidates.append({
                'selection': 'Draw', 'prob': probabilities['draw'], 'odd': odds['draw'], 'metrics': val_draw
            })
            
        # Test Away Win
        val_away = evaluate_value(probabilities['away_win'], odds['away_win'], self.min_ev)
        if val_away['is_value']:
            candidates.append({
                'selection': 'Away Win', 'prob': probabilities['away_win'], 'odd': odds['away_win'], 'metrics': val_away
            })

        # If no value anywhere, return None
        if not candidates:
            return None
            
        # Sort by EV to find the absolute best edge in the match
        candidates.sort(key=lambda x: x['metrics']['ev'], reverse=True)
        best_bet = candidates[0]
        
        # Calculate precise Kelly stake based on Bankroll
        recommended_stake = self.risk_manager.calculate_kelly_stake(
            model_prob=best_bet['prob'], 
            odds=best_bet['odd']
        )
        
        if recommended_stake <= 0:
            return None

        return {
            'match_id': match_id,
            'teams': teams,
            'selection': best_bet['selection'],
            'odds': best_bet['odd'],
            'model_probability': best_bet['prob'],
            'implied_probability': best_bet['metrics']['implied_prob'],
            'ev': best_bet['metrics']['ev'],
            'stake': round(recommended_stake, 2)
        }
