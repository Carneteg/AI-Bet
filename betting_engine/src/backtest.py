import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

class Backtester:
    def __init__(self, initial_bankroll: float):
        self.initial_bankroll = initial_bankroll

    def run_simulation(self, bets: pd.DataFrame, actual_results: pd.DataFrame):
        """
        Runs a chronological simulation of the engine's theoretical bets against reality.
        Returns a dictionary of academic metrics.
        """
        logger.info("Initializing Backtest Simulator...")
        
        current_bankroll = self.initial_bankroll
        peak_bankroll = self.initial_bankroll
        max_drawdown = 0.0
        
        wins = 0
        losses = 0
        total_staked = 0.0
        
        # Merge bets with reality
        # Assuming actual_results has columns: ['match_id', 'winning_selection']
        if 'winning_selection' not in actual_results.columns:
            logger.error("Backtest requires a 'winning_selection' column mimicking reality.")
            return None
            
        merged = pd.merge(bets, actual_results, on='match_id', how='inner')
        
        if merged.empty:
            logger.warning("No matches overlap between predicted bets and actual results.")
            return None
            
        for _, row in merged.iterrows():
            stake = row['stake']
            odds = row['odds']
            selection = row['selection']
            result_reality = row['winning_selection']
            
            total_staked += stake
            
            # Did the bet win?
            if selection == result_reality:
                wins += 1
                profit = stake * (odds - 1)
                current_bankroll += profit
            else:
                losses += 1
                current_bankroll -= stake
                
            # Track Drawdown
            if current_bankroll > peak_bankroll:
                peak_bankroll = current_bankroll
            else:
                drawdown = (peak_bankroll - current_bankroll) / peak_bankroll
                if drawdown > max_drawdown:
                    max_drawdown = drawdown
                    
        # Final Metrics
        total_profit = current_bankroll - self.initial_bankroll
        roi = (total_profit / total_staked) if total_staked > 0 else 0
        hit_rate = (wins / (wins + losses)) if (wins + losses) > 0 else 0
        
        logger.info("--- BACKTEST COMPLETE ---")
        logger.info(f"Initial Bankroll: ${self.initial_bankroll:,.2f}")
        logger.info(f"Final Bankroll:   ${current_bankroll:,.2f}")
        logger.info(f"Total Staked:     ${total_staked:,.2f}")
        logger.info(f"Net Profit:       ${total_profit:,.2f} ({roi*100:.2f}% ROI)")
        logger.info(f"Win/Loss Record:  {wins}W - {losses}L (Hit Rate: {hit_rate*100:.1f}%)")
        logger.info(f"Max Drawdown:     {max_drawdown*100:.2f}%")
        
        return {
            'roi': roi,
            'profit': total_profit,
            'hit_rate': hit_rate,
            'max_drawdown': max_drawdown
        }
