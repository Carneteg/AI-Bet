import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

def compute_rolling_features(df: pd.DataFrame, window: int = 5) -> pd.DataFrame:
    """
    Computes strict non-leaking historical rolling features.
    For each team, computes their last X matches properties.
    """
    logger.info(f"Computing Rolling Window Features (Window: {window})...")
    
    # Create a long-format tracker to easily group by team regardless of Home/Away
    home_df = df[['match_date', 'home_team', 'home_score', 'away_score']].copy()
    home_df['points'] = np.where(home_df['home_score'] > home_df['away_score'], 3, 
                            np.where(home_df['home_score'] == home_df['away_score'], 1, 0))
    home_df.rename(columns={'home_team': 'team', 'home_score': 'gf', 'away_score': 'ga'}, inplace=True)
    
    away_df = df[['match_date', 'away_team', 'away_score', 'home_score']].copy()
    away_df['points'] = np.where(away_df['away_score'] > away_df['home_score'], 3, 
                            np.where(away_df['away_score'] == away_df['home_score'], 1, 0))
    away_df.rename(columns={'away_team': 'team', 'away_score': 'gf', 'home_score': 'ga'}, inplace=True)
    
    # Combine and sort chronologically again
    long_df = pd.concat([home_df, away_df]).sort_values('match_date').reset_index()
    
    # Calculate rolling metrics strictly based on past games
    # We must SHIFT(1) so the current match doesn't leak its own outcome into its pre-match features
    grouped = long_df.groupby('team')
    
    long_df['pts_last_5'] = grouped['points'].transform(lambda x: x.rolling(window, min_periods=1).sum().shift(1))
    long_df['gf_last_5'] = grouped['gf'].transform(lambda x: x.rolling(window, min_periods=1).mean().shift(1))
    long_df['ga_last_5'] = grouped['ga'].transform(lambda x: x.rolling(window, min_periods=1).mean().shift(1))
    
    # Calculate Rest Days
    long_df['prev_match_date'] = grouped['match_date'].shift(1)
    long_df['rest_days'] = (long_df['match_date'] - long_df['prev_match_date']).dt.days
    long_df['rest_days'] = long_df['rest_days'].fillna(14) # Default to 14 if first game of season
    
    # Merge back to the master dataframe
    # Merge Home stats
    df = df.merge(
        long_df[['index', 'pts_last_5', 'gf_last_5', 'ga_last_5', 'rest_days']],
        left_index=True, right_on='index', how='left'
    )
    df.rename(columns={
        'pts_last_5': 'home_pts_l5', 
        'gf_last_5': 'home_gf_l5', 
        'ga_last_5': 'home_ga_l5',
        'rest_days': 'home_rest_days'
    }, inplace=True)
    df = df.drop(columns=['index'])
    
    # Hacky merge for away because indices were duplicated in long_df
    # We just create a fresh lookup for away based on Date + Team Match
    away_lookup = long_df.set_index(['match_date', 'team'])[['pts_last_5', 'gf_last_5', 'ga_last_5', 'rest_days']]
    
    df = df.join(away_lookup, on=['match_date', 'away_team'])
    df.rename(columns={
        'pts_last_5': 'away_pts_l5', 
        'gf_last_5': 'away_gf_l5', 
        'ga_last_5': 'away_ga_l5',
        'rest_days': 'away_rest_days'
    }, inplace=True)
    
    return df

def compute_market_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes closing line movement (steam) if the dataset contains both 
    opening and closing bookmaker odds. Native NaN bypassing.
    """
    logger.info("Computing Market Steam Features (Line Movement)...")
    
    # 1. Verify if odds columns even exist in this dataset
    req_cols = ['opening_odds_home', 'closing_odds_home', 'opening_odds_away', 'closing_odds_away']
    if not all(col in df.columns for col in req_cols):
        logger.warning("Required Market Odds columns missing from input data. Market features will be encoded as NaN.")
        df['implied_prob_close_home'] = np.nan
        df['implied_prob_close_away'] = np.nan
        df['line_movement_home'] = np.nan
        df['line_movement_away'] = np.nan
        return df

    # 2. Implied Probability Calculation
    df['implied_prob_open_home'] = 1.0 / df['opening_odds_home']
    df['implied_prob_close_home'] = 1.0 / df['closing_odds_home']
    
    df['implied_prob_open_away'] = 1.0 / df['opening_odds_away']
    df['implied_prob_close_away'] = 1.0 / df['closing_odds_away']
    
    # 3. Market Steam (Line Movement) 
    # Positive means the probability went UP (sharp money hammered them)
    df['line_movement_home'] = df['implied_prob_close_home'] - df['implied_prob_open_home']
    df['line_movement_away'] = df['implied_prob_close_away'] - df['implied_prob_open_away']
    
    return df

