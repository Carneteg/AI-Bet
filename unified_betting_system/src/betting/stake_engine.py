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
        Calculates disciplined bankroll deployment based on fixed units:
        LOW = 0.5u, MEDIUM = 1.0u, HIGH = 1.5u, VERY HIGH = 2.0u
        (1 unit = 1% of bankroll)
        """
        
        if odds <= 1.0 or probability <= 0.0 or bankroll <= 0.0:
            return self._build_zero_response("Invalid input parameters (odds, prob, or bankroll).")

        # 1 Unit = 1% of bankroll
        unit_val = bankroll * 0.01
        
        # Fixed Unit Mapping
        unit_multiplier = {
            "LOW": 0.5,
            "MEDIUM": 1.0,
            "HIGH": 1.5,
            "VERY_HIGH": 2.0
        }.get(confidence_level.upper(), 0.0)

        proposed_stake = unit_val * unit_multiplier
        proposed_stake_pct = proposed_stake / bankroll

        # Rule: Max 2% per bet
        final_stake = min(proposed_stake, bankroll * 0.02)
        
        # Rule: Max 5% total daily exposure
        available_daily_exposure = (bankroll * self.max_daily_exposure_pct) - current_daily_exposure
        
        if available_daily_exposure <= 0:
             return self._build_zero_response(f"Daily exposure limit of 5% reached.")
             
        final_stake = min(final_stake, available_daily_exposure)
        final_stake_pct = final_stake / bankroll

        explanation = (
            f"Tier: {confidence_level.upper()} ({unit_multiplier}u). "
            f"Proposed: {proposed_stake:.2f} SEK ({proposed_stake_pct*100:.2f}%). "
            f"Final deployment after caps: {final_stake_pct*100:.2f}%."
        )

        return {
            "stake_amount": round(final_stake, 2),
            "stake_units": unit_multiplier if final_stake >= proposed_stake else round(final_stake / unit_val, 2),
            "explanation": explanation
        }
        
    def _build_zero_response(self, explanation: str) -> Dict[str, Union[float, str]]:
        return {
            "stake_amount": 0.0,
            "stake_percent": 0.0,
            "capped_stake": 0.0,
            "explanation": explanation
        }
