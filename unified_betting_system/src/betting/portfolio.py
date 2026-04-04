import pandas as pd
from typing import List, Dict

class PortfolioManager:
    def __init__(self, max_daily_exposure_pct: float = 0.15):
        self.max_exposure = max_daily_exposure_pct

    def optimize_slate(self, bets: List[Dict], bankroll: float) -> List[Dict]:
        """Limits total capital exposed on any given slate of games to prevent variance ruin."""
        if not bets:
            return []
            
        df = pd.DataFrame(bets)
        df = df.sort_values(by='ev', ascending=False)
        
        approved_bets = []
        exposure = 0.0
        max_capital = bankroll * self.max_exposure
        
        for _, row in df.iterrows():
            stake = row['suggested_stake']
            if exposure + stake <= max_capital:
                approved_bets.append(row.to_dict())
                exposure += stake
            else:
                adjusted_stake = max_capital - exposure
                if adjusted_stake > 0:
                    r = row.to_dict()
                    r['suggested_stake'] = round(adjusted_stake, 2)
                    approved_bets.append(r)
                break
                
        return approved_bets
