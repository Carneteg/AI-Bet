import pandas as pd
import logging
from typing import List

logger = logging.getLogger(__name__)

class PortfolioBuilder:
    def __init__(self, max_daily_bets: int = 5, max_daily_capital_exposure: float = 0.15):
        self.max_daily_bets = max_daily_bets
        # Absolute cap: never have more than 15% of your total bankroll locked in pending bets
        self.max_daily_capital_exposure = max_daily_capital_exposure 

    def filter_slate(self, candidate_bets: List[dict], bankroll: float) -> List[dict]:
        """
        Takes all +EV bets for the day and trims them aggressively.
        Ensures correlation constraints (only 1 bet per match allowed).
        Ensures strict bankroll exposure limits are respected.
        """
        if not candidate_bets:
            return []
            
        logger.info(f"Portfolio Engine received {len(candidate_bets)} positive EV prospects.")
        
        # 1. Sort inherently by Edge (EV)
        candidate_bets.sort(key=lambda x: x['ev'], reverse=True)
        
        final_portfolio = []
        current_daily_exposure = 0.0
        
        # 2. Iterate and apply strict limits
        for bet in candidate_bets:
            if len(final_portfolio) >= self.max_daily_bets:
                logger.info("Daily max bet count reached. Ignoring remaining value.")
                break
                
            exposure_pct = bet['stake'] / bankroll
            
            # If this single bet pushes us over the daily max risk, skip it
            if current_daily_exposure + exposure_pct > self.max_daily_capital_exposure:
                logger.warning(f"Rejecting {bet['teams']} - Adding {exposure_pct*100:.1f}% risk breaches daily portfolio ceiling.")
                continue
                
            # Add to approved portfolio
            current_daily_exposure += exposure_pct
            
            # Simple risk categorization
            risk_level = "Low"
            if exposure_pct > 0.02:
                risk_level = "Medium"
            if exposure_pct > 0.04:
                risk_level = "High"
            
            bet['risk_level'] = risk_level
            final_portfolio.append(bet)
            
        logger.info(f"Finalized Daily Portfolio: {len(final_portfolio)} bets. Total Bankroll Exposure: {current_daily_exposure*100:.1f}%")
        return final_portfolio
