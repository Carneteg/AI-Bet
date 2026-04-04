import pandas as pd
import logging

logger = logging.getLogger(__name__)

class EloSystem:
    def __init__(self, base_rating=1500, k_factor=20):
        self.base_rating = base_rating
        self.k_factor = k_factor
        self.ratings = {} # Dictionary holding current rating for each team

    def _get_expected_score(self, rating_a, rating_b):
        """Calculates expected probability of A winning against B"""
        return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))

    def _update_rating(self, rating, expected_score, actual_score):
        """Updates rating based on k-factor difference"""
        return rating + self.k_factor * (actual_score - expected_score)

    def get_rating(self, team_name: str) -> float:
        """Returns current rating, defaults to base if new team"""
        if team_name not in self.ratings:
            self.ratings[team_name] = self.base_rating
        return self.ratings[team_name]

def generate_elo_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Linearly scans the chronological dataframe and calculates the exact ELO for 
    both teams strictly BEFORE the match starts, then updates the ledger.
    """
    logger.info("Computing Time-Series Elo Framework...")
    elo = EloSystem()
    
    pre_match_elo_home = []
    pre_match_elo_away = []
    
    for idx, row in df.iterrows():
        home_team = row['home_team']
        away_team = row['away_team']
        
        # 1. Fetch CURRENT elo (This is safely pre-match)
        curr_home_elo = elo.get_rating(home_team)
        curr_away_elo = elo.get_rating(away_team)
        
        # Add a home-field advantage static boost (+30 elo)
        adjusted_home_elo = curr_home_elo + 30 
        
        pre_match_elo_home.append(curr_home_elo)
        pre_match_elo_away.append(curr_away_elo)
        
        # 2. Determine match result (1=Home Win, 0.5=Draw, 0=Away Win)
        h_score = row['home_score']
        a_score = row['away_score']
        
        if h_score > a_score:
            s_home, s_away = 1, 0
        elif h_score == a_score:
            s_home, s_away = 0.5, 0.5
        else:
            s_home, s_away = 0, 1
            
        # 3. Calculate expected and update
        exp_home = elo._get_expected_score(adjusted_home_elo, curr_away_elo)
        exp_away = elo._get_expected_score(curr_away_elo, adjusted_home_elo)
        
        elo.ratings[home_team] = elo._update_rating(curr_home_elo, exp_home, s_home)
        elo.ratings[away_team] = elo._update_rating(curr_away_elo, exp_away, s_away)
        
    # Append strictly the PRE-MATCH elos to the dataframe
    df['elo_home'] = pre_match_elo_home
    df['elo_away'] = pre_match_elo_away
    df['elo_diff'] = df['elo_home'] - df['elo_away']
    
    return df
