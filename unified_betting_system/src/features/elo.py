import pandas as pd
from src.utils import setup_logger

logger = setup_logger(__name__)

class EloSystem:
    def __init__(self, base_rating=1500, k_factor=20):
        self.base_rating = base_rating
        self.k_factor = k_factor
        self.ratings = {}

    def _get_expected_score(self, rating_a, rating_b):
        return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))

    def _update_rating(self, rating, expected_score, actual_score):
        return rating + self.k_factor * (actual_score - expected_score)

    def get_rating(self, team_name: str) -> float:
        if team_name not in self.ratings:
            self.ratings[team_name] = self.base_rating
        return self.ratings[team_name]

def generate_elo_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes strictly pre-match historical ELO ratings."""
    logger.info("Computing Time-Series Elo Framework...")
    elo = EloSystem()
    
    pre_match_elo_home = []
    pre_match_elo_away = []
    
    for idx, row in df.iterrows():
        home_team = row['home_team']
        away_team = row['away_team']
        
        curr_home_elo = elo.get_rating(home_team)
        curr_away_elo = elo.get_rating(away_team)
        
        adjusted_home_elo = curr_home_elo + 30 # Home field adv
        
        pre_match_elo_home.append(curr_home_elo)
        pre_match_elo_away.append(curr_away_elo)
        
        h_score, a_score = row['home_score'], row['away_score']
        s_home = 1 if h_score > a_score else 0.5 if h_score == a_score else 0
        s_away = 1 - s_home
            
        exp_home = elo._get_expected_score(adjusted_home_elo, curr_away_elo)
        exp_away = elo._get_expected_score(curr_away_elo, adjusted_home_elo)
        
        elo.ratings[home_team] = elo._update_rating(curr_home_elo, exp_home, s_home)
        elo.ratings[away_team] = elo._update_rating(curr_away_elo, exp_away, s_away)
        
    df['elo_home'] = pre_match_elo_home
    df['elo_away'] = pre_match_elo_away
    df['elo_diff'] = df['elo_home'] - df['elo_away']
    
    return df
