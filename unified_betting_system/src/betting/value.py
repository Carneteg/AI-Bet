from typing import Dict, Optional

class ValueDetector:
    def __init__(self, min_ev_threshold: float = 0.03):
        self.min_ev = min_ev_threshold

    def evaluate(self, odds: float, prob: float) -> Optional[Dict]:
        if odds <= 1.0 or prob <= 0:
            return None
            
        implied_prob = 1.0 / odds
        edge = prob - implied_prob
        ev = (prob * odds) - 1.0
        
        if ev >= self.min_ev:
            return {
                "odds": odds,
                "model_prob": prob,
                "implied_prob": implied_prob,
                "edge": edge,
                "ev": ev
            }
        return None
