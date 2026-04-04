class RiskManager:
    def __init__(self, kelly_fraction: float = 0.25, max_bet_pct: float = 0.03):
        self.kelly_fraction = kelly_fraction
        self.max_bet_pct = max_bet_pct

    def calculate_stake(self, prob: float, odds: float, bankroll: float) -> float:
        b = odds - 1.0
        q = 1.0 - prob
        
        kelly_pct = ((b * prob) - q) / b
        
        if kelly_pct <= 0:
            return 0.0
            
        adjusted_kelly = kelly_pct * self.kelly_fraction
        final_pct = min(adjusted_kelly, self.max_bet_pct)
        
        return round(bankroll * final_pct, 2)
