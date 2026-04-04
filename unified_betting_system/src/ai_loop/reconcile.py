import pandas as pd
import numpy as np
import logging
from src.utils import setup_logger

logger = setup_logger(__name__)

def reconcile_bets(predictions_df: pd.DataFrame, results_df: pd.DataFrame) -> pd.DataFrame:
    logger.info("Reconciling historical predictions against Closing Line Value (CLV)...")
    
    if predictions_df.empty or results_df.empty:
        logger.warning("Missing prediction or result data for reconciliation.")
        return pd.DataFrame()
        
    df = predictions_df.merge(results_df, on='match_id', how='inner')
    
    # Fundamental Win/Loss calculation
    conditions = [
        (df['home_score'] > df['away_score']),
        (df['home_score'] == df['away_score']),
        (df['home_score'] < df['away_score'])
    ]
    choices = ['Home Win', 'Draw', 'Away Win']
    df['winning_selection'] = np.select(conditions, choices, default='Unknown')
    
    p_conds = [
        (df['home_win_prob'] >= df['draw_prob']) & (df['home_win_prob'] >= df['away_win_prob']),
        (df['draw_prob'] >= df['home_win_prob']) & (df['draw_prob'] >= df['away_win_prob']),
        (df['away_win_prob'] >= df['home_win_prob']) & (df['away_win_prob'] >= df['draw_prob'])
    ]
    df['model_choice'] = np.select(p_conds, choices, default='Unknown')
    df['bet_won'] = (df['model_choice'] == df['winning_selection']).astype(int)
    
    # ---------------------------------------------------------
    # NEW: Advanced CLV Reconciliation
    # The true mark of success isn't hitting the bet, it's beating the closing line.
    # ---------------------------------------------------------
    if 'closing_implied_prob_home' in df.columns:
        # Evaluate whether the model successfully found probability that the market eventually moved towards
        clv_conds = [
            (df['model_choice'] == 'Home Win') & (df['home_win_prob'] > df['closing_implied_prob_home']),
            (df['model_choice'] == 'Draw') & (df['draw_prob'] > df['closing_implied_prob_draw']),
            (df['model_choice'] == 'Away Win') & (df['away_win_prob'] > df['closing_implied_prob_away'])
        ]
        df['clv_beaten'] = np.select(clv_conds, [1, 1, 1], default=0)
        clv_win_rate = df['clv_beaten'].mean() * 100
        logger.info(f"System generated CLV value on {clv_win_rate:.1f}% of historical wagers.")
    else:
        logger.warning("Closing Line data missing. Bypassing CLV settlement tracking.")
        df['clv_beaten'] = np.nan
        
    return df
