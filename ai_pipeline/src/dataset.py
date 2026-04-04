import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

def define_targets(df: pd.DataFrame) -> pd.DataFrame:
    """
    Constructs the Truth Labels for classification models.
    """
    logger.info("Generating Target Variables (Match Result, Total Goals)...")
    
    # 1. Match Result Classifier (HomeWin=0, Draw=1, AwayWin=2)
    conditions = [
        (df['home_score'] > df['away_score']),
        (df['home_score'] == df['away_score']),
        (df['home_score'] < df['away_score'])
    ]
    choices = [0, 1, 2]
    df['target_match_result'] = np.select(conditions, choices, default=np.nan)
    
    # 2. Over/Under 2.5 Classifier (Over=1, Under=0)
    df['total_goals'] = df['home_score'] + df['away_score']
    df['target_over_2_5'] = np.where(df['total_goals'] > 2.5, 1, 0)
    
    return df

def build_final_dataset(df: pd.DataFrame, min_matches: int = 5) -> pd.DataFrame:
    """
    Strips raw descriptive data, drops initialization rows, and returns a purely mathematical
    feature matrix ready for scikit-learn.
    """
    # Define exact feature columns we trust
    feature_cols = [
        'match_date', # Kept strictly for chronological Train/Test splitting
        # Elo
        'elo_home', 'elo_away', 'elo_diff',
        # Form
        'home_pts_l5', 'away_pts_l5',
        'home_gf_l5', 'away_gf_l5',
        'home_ga_l5', 'away_ga_l5',
        # Rest
        'home_rest_days', 'away_rest_days',
        # Market (XGBoost specific)
        'implied_prob_close_home', 'implied_prob_close_away',
        'line_movement_home', 'line_movement_away',
        # Targets
        'target_match_result', 'target_over_2_5'
    ]
    
    # Make sure we only pull columns that actually got generated
    available_cols = [c for c in feature_cols if c in df.columns]
    dataset = df[available_cols].copy()
    
    # Drop rows where rolling average is NaN (meaning the team hasn't played 5 games yet)
    initial_shape = dataset.shape[0]
    dataset = dataset.dropna()
    dropped = initial_shape - dataset.shape[0]
    
    logger.info(f"Dropped {dropped} initialization matches due to insufficient history window.")
    logger.info(f"Final ML-ready Matrix Shape: {dataset.shape}")
    
    return dataset
