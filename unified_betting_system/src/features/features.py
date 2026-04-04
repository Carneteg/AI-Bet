import pandas as pd
import numpy as np
import logging
from src.utils import setup_logger

logger = setup_logger(__name__)

def compute_rolling_features(df: pd.DataFrame, window: int = 5) -> pd.DataFrame:
    """Computes strict non-leaking historical rolling features via shift()."""
    logger.info(f"Computing Rolling Features (Window: {window})...")
    
    home_df = df[['match_date', 'home_team', 'home_score', 'away_score']].copy()
    home_df['points'] = np.where(home_df['home_score'] > home_df['away_score'], 3, 
                            np.where(home_df['home_score'] == home_df['away_score'], 1, 0))
    home_df.rename(columns={'home_team': 'team', 'home_score': 'gf', 'away_score': 'ga'}, inplace=True)
    
    away_df = df[['match_date', 'away_team', 'away_score', 'home_score']].copy()
    away_df['points'] = np.where(away_df['away_score'] > away_df['home_score'], 3, 
                            np.where(away_df['away_score'] == away_df['home_score'], 1, 0))
    away_df.rename(columns={'away_team': 'team', 'away_score': 'gf', 'home_score': 'ga'}, inplace=True)
    
    long_df = pd.concat([home_df, away_df]).sort_values('match_date').reset_index()
    grouped = long_df.groupby('team')
    
    long_df['pts_last_5'] = grouped['points'].transform(lambda x: x.rolling(window, min_periods=1).sum().shift(1))
    long_df['gf_last_5'] = grouped['gf'].transform(lambda x: x.rolling(window, min_periods=1).mean().shift(1))
    long_df['ga_last_5'] = grouped['ga'].transform(lambda x: x.rolling(window, min_periods=1).mean().shift(1))
    
    long_df['prev_match_date'] = grouped['match_date'].shift(1)
    long_df['rest_days'] = (long_df['match_date'] - long_df['prev_match_date']).dt.days
    long_df['rest_days'] = long_df['rest_days'].fillna(14) 
    
    df = df.merge(
        long_df[['index', 'pts_last_5', 'gf_last_5', 'ga_last_5', 'rest_days']],
        left_index=True, right_on='index', how='left'
    )
    df.rename(columns={
        'pts_last_5': 'home_pts_l5', 'gf_last_5': 'home_gf_l5', 
        'ga_last_5': 'home_ga_l5', 'rest_days': 'home_rest_days'
    }, inplace=True)
    df = df.drop(columns=['index'])
    
    away_lookup = long_df.set_index(['match_date', 'team'])[['pts_last_5', 'gf_last_5', 'ga_last_5', 'rest_days']]
    df = df.join(away_lookup, on=['match_date', 'away_team'])
    df.rename(columns={
        'pts_last_5': 'away_pts_l5', 'gf_last_5': 'away_gf_l5', 
        'ga_last_5': 'away_ga_l5', 'rest_days': 'away_rest_days'
    }, inplace=True)
    
    return df

def compute_market_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes closing line movement (steam) safely."""
    req_cols = ['opening_odds_home', 'closing_odds_home', 'opening_odds_away', 'closing_odds_away']
    if not all(col in df.columns for col in req_cols):
        logger.info("Market features bypassed (odds not supplied).")
        df['implied_prob_close_home'] = np.nan
        df['implied_prob_close_away'] = np.nan
        df['line_movement_home'] = np.nan
        df['line_movement_away'] = np.nan
        return df

    df['implied_prob_open_home'] = 1.0 / df['opening_odds_home']
    df['implied_prob_close_home'] = 1.0 / df['closing_odds_home']
    df['implied_prob_open_away'] = 1.0 / df['opening_odds_away']
    df['implied_prob_close_away'] = 1.0 / df['closing_odds_away']
    
    df['line_movement_home'] = df['implied_prob_close_home'] - df['implied_prob_open_home']
    df['line_movement_away'] = df['implied_prob_close_away'] - df['implied_prob_open_away']
    
    return df
