import pandas as pd
from typing import List, Dict
from src.coupon_strategist.streck_analyzer import StreckAnalyzer
from src.utils import setup_logger

logger = setup_logger(__name__)

class SvenskaSpelCoupon:
    def __init__(self):
        self.analyzer = StreckAnalyzer(value_threshold=0.08)

    def _determine_guarding(self, model_probs: dict, streck: dict) -> dict:
        """
        Determines whether to Spik, Halvgardera, or Helgardera based on
        mathematical over-strecking by the Swedish public.
        """
        # Map values
        p_1, p_X, p_2 = model_probs.get('1', 0), model_probs.get('X', 0), model_probs.get('2', 0)
        s_1, s_X, s_2 = streck.get('1', 0), streck.get('X', 0), streck.get('2', 0)
        
        edges = {
            '1': self.analyzer.evaluate_edge(p_1, s_1),
            'X': self.analyzer.evaluate_edge(p_X, s_X),
            '2': self.analyzer.evaluate_edge(p_2, s_2)
        }
        
        # Sort outcomes by highest probability
        sorted_probs = sorted([('1', p_1), ('X', p_X), ('2', p_2)], key=lambda x: x[1], reverse=True)
        primary_sign, primary_prob = sorted_probs[0]
        
        # If the highest probability outcome is highly likely AND has positive edge -> SPIK
        if primary_prob > 0.55 and edges[primary_sign] > -0.05:
            conf = self.analyzer.classify_confidence(edges[primary_sign], primary_prob)
            return {
                "action": "Spik", 
                "sign": primary_sign, 
                "confidence": conf,
                "reason": f"Strong EV anchor. True Prob: {primary_prob*100:.0f}% vs Streck {streck.get(primary_sign)*100:.0f}%"
            }
            
        # If public heavily overvalues the favorite, guard it.
        # Find the most overvalued sign by public (most negative edge)
        worst_edge_sign = min(edges, key=edges.get)
        if edges[worst_edge_sign] < -0.20:
            # Huge trap. We must cover the other two signs if possible (Halv) or all 3 (Hel).
            best_value_signs = sorted(edges, key=edges.get, reverse=True)[:2]
            return {
                "action": "Halv" if primary_prob > 0.40 else "Hel",
                "sign": f"{best_value_signs[0]},{best_value_signs[1]}" if primary_prob > 0.40 else "1X2",
                "confidence": "Medium",
                "reason": f"Trap detected. {worst_edge_sign} is heavily over-streckad ({streck.get(worst_edge_sign)*100:.0f}% vs {model_probs.get(worst_edge_sign)*100:.0f}%). Attacking variance."
            }
            
        # Default variance game with no huge edges -> Helgardering
        return {
            "action": "Hel",
            "sign": "1X2",
            "confidence": "Low",
            "reason": "Perfectly balanced variance game. No distinctive edge detected."
        }

    def evaluate_match(self, match: Dict) -> Dict:
        """Evaluates a single Svenska Spel match dictionary."""
        # Convert raw strings to floats
        m_probs = {
            '1': float(match.get('prob_1', 0.33)),
            'X': float(match.get('prob_X', 0.33)),
            '2': float(match.get('prob_2', 0.33))
        }
        s_pct = {
            '1': float(match.get('streck_1', 0.33)),
            'X': float(match.get('streck_X', 0.33)),
            '2': float(match.get('streck_2', 0.33))
        }
        
        evaluation = self._determine_guarding(m_probs, s_pct)
        
        result = match.copy()
        result.update(evaluation)
        result['stake'] = self.analyzer.assign_stake(evaluation['confidence'])
        
        return result
