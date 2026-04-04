import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

def reconcile_bets(predictions_df: pd.DataFrame) -> pd.DataFrame:
    """
    Simulates the reconciliation engine. Assumes predictions_df contains
    both the theoretical bet constraints and the 'winning_selection' (reality).
    """
    logger.info("Reconciling historical predictions against reality...")
    
    if 'winning_selection' not in predictions_df.columns:
        logger.warning("No 'winning_selection' reality column found. Cannot reconcile.")
        return pd.DataFrame()
        
    df = predictions_df.copy()
    
    # Calculate Bet Outcome (Binary Win/Loss based on highest prob choice for simplicity)
    # In a full production loop, this would import the exact bets from bets.csv
    
    # Let's dynamically determine the "Choice" the model would have made
    # (Whichever outcome had the highest model probability)
    conditions = [
        (df['home_win_prob'] >= df['draw_prob']) & (df['home_win_prob'] >= df['away_win_prob']),
        (df['draw_prob'] >= df['home_win_prob']) & (df['draw_prob'] >= df['away_win_prob']),
        (df['away_win_prob'] >= df['home_win_prob']) & (df['away_win_prob'] >= df['draw_prob'])
    ]
    choices = ['Home Win', 'Draw', 'Away Win']
    df['model_choice'] = pd.Series(np.select(conditions, choices, default='Unknown'), index=df.index)
    
    # Win or Loss
    df['bet_won'] = (df['model_choice'] == df['winning_selection']).astype(int)
    
    logger.info(f"Reconciled {len(df)} historical matches.")
    return df
