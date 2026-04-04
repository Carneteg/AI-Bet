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
                     current_exposure: float) -> Dict[str, Union[str, float]]:
        """
        Evaluates whether a bet should be placed based on strict quantitative logic.
        """
        # 1. Base Computations
        if odds <= 1.0 or model_probability <= 0.0:
            return self._build_pass(0.0, 0.0, "Invalid probability or odds.")

        implied_probability = 1.0 / odds
        edge = model_probability - implied_probability
        ev = (model_probability * odds) - 1.0

        # 2. Strict Threshold Rules
        if data_quality_score < 0.90:
            return self._build_pass(edge, ev, f"Data Quality too low ({data_quality_score:.2f} < 0.90)")
            
        if edge < 0.04:
            return self._build_pass(edge, ev, f"Mathematical Edge insufficient ({edge:.3f} < 0.04)")
            
        if ev < 0.03:
            return self._build_pass(edge, ev, f"Expected Value insufficient ({ev:.3f} < 0.03)")
            
        if confidence_score < 0.58:
            return self._build_pass(edge, ev, f"Model Confidence too low ({confidence_score:.2f} < 0.58)")
            
        if current_exposure >= self.exposure_limit:
            return self._build_pass(edge, ev, f"Coupon Exposure Limit Reached ({current_exposure*100:.1f}%)")

        # 3. Profitable Segment Execution
        if segment_roi < 0.0:
            return {
                "decision": "SMALL_BET",
                "edge": edge,
                "ev": ev,
                "reasoning": f"Negative Segment ROI ({segment_roi*100:.1f}%). Reducing stake exposure."
            }

        # 4. Standard Execution
        return {
            "decision": "BET",
            "edge": edge,
            "ev": ev,
            "reasoning": "Clear edge. High data quality. Positive segment history."
        }

    def _build_pass(self, edge: float, ev: float, reason: str) -> Dict[str, Union[str, float]]:
        return {
            "decision": "PASS",
            "edge": edge,
            "ev": ev,
            "reasoning": reason
        }
