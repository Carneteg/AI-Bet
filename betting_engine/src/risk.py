import logging

logger = logging.getLogger(__name__)

class RiskManager:
    def __init__(self, bankroll: float, kelly_fraction: float = 0.25, max_risk_pct: float = 0.05):
        self.bankroll = bankroll
        
        # Quarter Kelly protects against AI Model overconfidence 
        # (models assuming 60% win-rate when true win-rate is 52%)
        self.kelly_fraction = kelly_fraction
        
        # Absolute ceiling on risk per bet (default: max 5% of bankroll)
        self.max_risk_pct = max_risk_pct

    def calculate_kelly_stake(self, model_prob: float, odds: float) -> float:
        """
        Executes standard Kelly formula, dampens it with the fractional multiplier.
        Returns the absolute dollar amount to risk.
        """
        b = odds - 1.0  # Decimals odds minus 1 = net decimal odds (e.g. 2.50 implies 1.5 units profit)
        p = model_prob
        q = 1.0 - p
        
        # Kelly Formula = (bp - q) / b
        f_star = ( (b * p) - q ) / b
        
        # If mathematically negative, we shouldn't be betting anyway
        if f_star <= 0:
            return 0.0
            
        # Dampen with the Fraction (e.g. Quarter Kelly)
        target_allocation_pct = f_star * self.kelly_fraction
        
        # Apply strict safety ceiling
        if target_allocation_pct > self.max_risk_pct:
            logger.warning(f"Kelly formula suggested unsafe {target_allocation_pct*100:.1f}% stake. Capping at {self.max_risk_pct*100:.1f}%.")
            target_allocation_pct = self.max_risk_pct
            
        # Return exact monetary sizing
        return self.bankroll * target_allocation_pct
