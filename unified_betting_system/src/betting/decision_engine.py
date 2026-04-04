from typing import Dict, Union

class DecisionEngine:
    def __init__(self, exposure_limit: float = 0.05):
        self.exposure_limit = exposure_limit

    def evaluate_bet(self, 
                     model_probability: float, 
                     odds: float, 
                     confidence_score: float, 
                     data_quality_score: float, 
                     segment_roi: float, 
                     current_exposure: float,
                     market_steam: float = 0.0) -> Dict[str, Union[str, float]]:
        """
        Evaluates quantitative parameters against strict variance-adjusted hurdles.
        """
        if odds <= 1.0 or model_probability <= 0.0:
            return self._build_pass(0.0, 0.0, "Invalid probability or odds.")

        implied_probability = 1.0 / odds
        edge = model_probability - implied_probability
        ev = (model_probability * odds) - 1.0

        # 1. Base Governance 
        if data_quality_score < 0.90:
            return self._build_pass(edge, ev, f"Data Quality too low ({data_quality_score:.2f} < 0.90)")
            
        if current_exposure >= self.exposure_limit:
            return self._build_pass(edge, ev, f"Coupon Exposure Limit Reached ({current_exposure*100:.1f}%)")

        # 2. Sharp Money Rule
        # If market_steam is substantially negative (market is heavily betting against our model's pick)
        if market_steam < -0.05:
            return self._build_pass(edge, ev, f"Sharp Money Conflict (Steam: {market_steam*100:.1f}%)")

        # 3. Variance-Adjusted Edge Matrix (Replacing flat 4% rule)
        req_edge = 0.0
        req_conf = 0.0
        
        if odds <= 1.65:       # Heavy Favorite
            req_edge = 0.03
            req_conf = 0.60
        elif odds <= 2.50:     # Coinflip
            req_edge = 0.05
            req_conf = 0.65
        elif odds <= 4.99:     # Underdog
            req_edge = 0.08
            req_conf = 0.70
        else:                  # Longshot (5.00+)
            req_edge = 0.12
            req_conf = 0.85
            
        if edge < req_edge:
            return self._build_pass(edge, ev, f"Edge ({edge*100:.1f}%) insufficient for odds bucket {odds} (requires {req_edge*100:.1f}%)")
            
        if confidence_score < req_conf:
            return self._build_pass(edge, ev, f"Confidence ({confidence_score:.2f}) insufficient for odds bucket {odds} (requires {req_conf})")

        # 4. Profitable Segment Execution
        if segment_roi < 0.0:
            return {
                "decision": "SMALL_BET",
                "edge": edge,
                "ev": ev,
                "reasoning": f"Negative Segment ROI ({segment_roi*100:.1f}%). Reducing stake exposure on marginal cluster."
            }

        # 5. Standard Execution
        return {
            "decision": "BET",
            "edge": edge,
            "ev": ev,
            "reasoning": f"Cleared Variance-Adjusted Hurdles for Odds {odds}."
        }

    def _build_pass(self, edge: float, ev: float, reason: str) -> Dict[str, Union[str, float]]:
        return {
            "decision": "PASS",
            "edge": edge,
            "ev": ev,
            "reasoning": reason
        }
