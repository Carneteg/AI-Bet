import pandas as pd
from src.utils import setup_logger

logger = setup_logger(__name__)

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Drops unplayed matches and converts scores to numeric."""
    if df.empty:
        return df
        
    logger.info("Executing row cleaning...")

    if 'home_score_full' in df.columns and 'away_score_full' in df.columns:
        df['home_score'] = pd.to_numeric(df['home_score_full'], errors='coerce')
        df['away_score'] = pd.to_numeric(df['away_score_full'], errors='coerce')
    else:
        df['home_score'] = None
        df['away_score'] = None

    initial_len = len(df)
    df = df.dropna(subset=['date', 'home_score', 'away_score'])
    logger.info(f"Dropped {initial_len - len(df)} unplayed rows.")
    
    return df
