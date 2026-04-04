from typing import Dict, Union

class NoBetFilter:
    def __init__(self):
        # Strict Rejection Boundaries
        self.min_edge = 0.04
        self.min_ev = 0.03
        self.min_conf = 0.58
        self.min_data_quality = 0.90
        
        # Steam / Odds Movement Boundaries
        self.max_odds_drop_pass = -0.10   # 10% movement against us is an automatic PASS
        self.max_odds_drop_reduce = -0.05 # 5% movement triggers REDUCE

    def evaluate(self, 
                 edge: float, 
                 ev: float, 
                 confidence: float, 
                 data_quality: float, 
                 odds_movement: float, 
                 missing_data_flag: bool) -> Dict[str, Union[str, float]]:
        """
        Executes a fundamental rejection sequence. Fails completely if any 
        quantitative core metric falls beneath the baseline viability threshold.
        """
        
        # 1. Fatal Flags
        if missing_data_flag:
            return self._build_response("PASS", "Missing critical data flag triggered.")

        # 2. Fundamental Math Metrics
        if edge < self.min_edge:
            return self._build_response("PASS", f"Edge ({edge*100:.1f}%) < {self.min_edge*100:.1f}%.")
            
        if ev < self.min_ev:
            return self._build_response("PASS", f"Expected Value ({ev*100:.1f}%) < {self.min_ev*100:.1f}%.")
            
        if confidence < self.min_conf:
            return self._build_response("PASS", f"Model Confidence ({confidence:.2f}) < {self.min_conf}.")
            
        if data_quality < self.min_data_quality:
            return self._build_response("PASS", f"Data Quality ({data_quality:.2f}) < {self.min_data_quality}.")
            
        # 3. Market Steam Assessment
        if odds_movement < self.max_odds_drop_pass:
            return self._build_response("PASS", f"Severe Sharp Steam against position ({odds_movement*100:.1f}%).")
            
        if odds_movement < self.max_odds_drop_reduce:
            return self._build_response("REDUCE", f"Moderate Steam against position ({odds_movement*100:.1f}%). Margin compromised.")

        # 4. Safe Passage
        return self._build_response("OK", "Cleared all strict NO BET governors.")

    def _build_response(self, decision: str, reason: str) -> Dict[str, str]:
        return {
            "decision": decision,
            "reason": reason
        }
