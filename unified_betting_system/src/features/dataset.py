import pandas as pd
import numpy as np
from src.utils import setup_logger

logger = setup_logger(__name__)

def define_targets(df: pd.DataFrame) -> pd.DataFrame:
    logger.info("Generating Target Classification Labels...")
    
    conditions = [
        (df['home_score'] > df['away_score']),
        (df['home_score'] == df['away_score']),
        (df['home_score'] < df['away_score'])
    ]
    df['target_match_result'] = np.select(conditions, [0, 1, 2], default=np.nan)
    
    df['total_goals'] = df['home_score'] + df['away_score']
    df['target_over_2_5'] = np.where(df['total_goals'] > 2.5, 1, 0)
    
    return df

def build_final_dataset(df: pd.DataFrame, min_matches: int = 5) -> pd.DataFrame:
    feature_cols = [
        'match_id', 'match_date', 'home_team', 'away_team', 
        'elo_home', 'elo_away', 'elo_diff',
        'home_pts_l5', 'away_pts_l5',
        'home_gf_l5', 'away_gf_l5',
        'home_ga_l5', 'away_ga_l5',
        'home_rest_days', 'away_rest_days',
        'implied_prob_close_home', 'implied_prob_close_away',
        'line_movement_home', 'line_movement_away',
        'target_match_result', 'target_over_2_5'
    ]
    
    available_cols = [c for c in feature_cols if c in df.columns]
    dataset = df[available_cols].copy()
    
    initial_shape = dataset.shape[0]
    dataset = dataset.dropna(subset=['home_pts_l5']) # Drop init rows
    logger.info(f"Dropped {initial_shape - dataset.shape[0]} initialization matches lacking rolling history.")
    
    return dataset
