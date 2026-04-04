from typing import Dict, Union

class BetScorecard:
    def __init__(self):
        # Classification Thresholds
        self.thresh_high = 7
        self.thresh_medium = 4
        self.thresh_low = 1

    def grade(self, 
              ev: float, 
              confidence: float, 
              clv_signal: float, 
              lineup_confirmed: bool, 
              public_bias: bool, 
              data_quality: float, 
              odds_movement: float, 
              uncertainty_flag: bool) -> Dict[str, Union[int, str]]:
        """
        Dynamically grades the viability of an incoming bet across multiple qualitative 
        and quantitative spectrums.
        """
        
        score = 0
        
        # 1. Expected Value
        if ev > 0.06:
            score += 3
        elif 0.03 <= ev <= 0.06:
            score += 2
            
        # 2. Confidence
        if confidence > 0.65:
            score += 2
        elif 0.58 <= confidence <= 0.65:
            score += 1
            
        # 3. Closing Line Value Anticipation
        if clv_signal > 0.0:  # Assuming positive clv_signal float implies beating the line
            score += 2
            
        # 4. Binary Modifiers
        if lineup_confirmed:
            score += 1
            
        if public_bias:
            score += 1

        # 5. Data Quality (Assuming > 0.90 is "high")
        if data_quality >= 0.90:
            score += 1
            
        # 6. Negative Penalties
        if odds_movement < 0.0: # Assuming negative odds movement equates to bad steam
            score -= 2
            
        if uncertainty_flag:
            score -= 2
            
        # 7. Classification Mapping
        classification = "PASS"
        if score >= self.thresh_high:
            classification = "HIGH"
        elif score >= self.thresh_medium:
            classification = "MEDIUM"
        elif score >= self.thresh_low:
            classification = "LOW"
            
        return {
            "total_score": score,
            "classification": classification
        }
