import pandas as pd
import numpy as np
import logging
from src.utils import setup_logger

logger = setup_logger(__name__)

def reconcile_bets(predictions_df: pd.DataFrame, results_df: pd.DataFrame) -> pd.DataFrame:
    logger.info("Reconciling historical predictions against reality...")
    
    if predictions_df.empty or results_df.empty:
        logger.warning("Missing prediction or result data for reconciliation.")
        return pd.DataFrame()
        
    df = predictions_df.merge(results_df, on='match_id', how='inner')
    
    conditions = [
        (df['home_score'] > df['away_score']),
        (df['home_score'] == df['away_score']),
        (df['home_score'] < df['away_score'])
    ]
    choices = ['Home Win', 'Draw', 'Away Win']
    df['winning_selection'] = np.select(conditions, choices, default='Unknown')
    
    # Determine what the model *would* have picked just by max pure probability
    p_conds = [
        (df['home_win_prob'] >= df['draw_prob']) & (df['home_win_prob'] >= df['away_win_prob']),
        (df['draw_prob'] >= df['home_win_prob']) & (df['draw_prob'] >= df['away_win_prob']),
        (df['away_win_prob'] >= df['home_win_prob']) & (df['away_win_prob'] >= df['draw_prob'])
    ]
    df['model_choice'] = np.select(p_conds, choices, default='Unknown')
    
    df['bet_won'] = (df['model_choice'] == df['winning_selection']).astype(int)
    
    logger.info(f"Reconciled {len(df)} historical matches safely.")
    return df
