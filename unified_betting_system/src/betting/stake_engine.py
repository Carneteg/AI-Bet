from typing import Dict, Union

class StakeEngine:
    def __init__(self, kelly_fraction: float = 0.25):
        self.kelly_fraction = kelly_fraction
        self.max_daily_exposure_pct = 0.05
        
        self.confidence_caps = {
            "LOW": 0.005,        # 0.5%
            "MEDIUM": 0.010,     # 1.0%
            "HIGH": 0.015,       # 1.5%
            "VERY_HIGH": 0.020   # 2.0%
        }

    def calculate(self, 
                  bankroll: float, 
                  probability: float, 
                  odds: float, 
                  confidence_level: str, 
                  current_daily_exposure: float = 0.0) -> Dict[str, Union[float, str]]:
        """
        Calculates disciplined bankroll deployment combining Fractional Kelly 
        and strict confidence-based exposure mapping.
        """
        
        if odds <= 1.0 or probability <= 0.0 or bankroll <= 0.0:
            return self._build_zero_response("Invalid input parameters (odds, prob, or bankroll).")

        b = odds - 1.0
        kelly_pure = ((probability * odds) - 1.0) / b
        
        if kelly_pure <= 0:
            return self._build_zero_response("Negative Expected Value. Kelly dictates zero stake.")
            
        stake_kelly = bankroll * kelly_pure * self.kelly_fraction
        stake_kelly_pct = stake_kelly / bankroll

        # Enforce Confidence-Based hard caps
        confidence_key = str(confidence_level).upper()
        cap_pct = self.confidence_caps.get(confidence_key, 0.005) # Default to lowest if missing
        
        # Max 2% per bet is inherently satisfied by VERY_HIGH tier maxing at 2.0%
        capped_stake_pct = min(stake_kelly_pct, cap_pct)
        capped_stake = bankroll * capped_stake_pct
        
        # Enforce 5% daily exposure limit
        available_daily_exposure = (bankroll * self.max_daily_exposure_pct) - current_daily_exposure
        
        if available_daily_exposure <= 0:
             return self._build_zero_response(f"Daily exposure limit of 5% reached.")
             
        final_stake = min(capped_stake, available_daily_exposure)
        final_stake_pct = final_stake / bankroll

        explanation = (
            f"Pure Kelly indicates {kelly_pure*100:.2f}%. "
            f"Fractional Kelly (1/4) suggests {stake_kelly_pct*100:.2f}%. "
            f"Cap applied for {confidence_key} tier: max {cap_pct*100:.2f}%. "
            f"Final deployment: {final_stake_pct*100:.2f}%."
        )

        return {
            "stake_amount": round(final_stake, 2),
            "stake_percent": round(final_stake_pct * 100, 2),
            "capped_stake": round(capped_stake, 2),
            "explanation": explanation
        }
        
    def _build_zero_response(self, explanation: str) -> Dict[str, Union[float, str]]:
        return {
            "stake_amount": 0.0,
            "stake_percent": 0.0,
            "capped_stake": 0.0,
            "explanation": explanation
        }
