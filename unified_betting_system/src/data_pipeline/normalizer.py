import pandas as pd
from src.utils import setup_logger

logger = setup_logger(__name__)

def normalize_data(df: pd.DataFrame) -> pd.DataFrame:
    """Enforces Date chronology and cleans string categoricals."""
    if df.empty:
        return df
        
    df['match_date'] = pd.to_datetime(df['date'], errors='coerce')
    
    df['home_team'] = df['home_team'].astype(str).str.strip().str.upper()
    df['away_team'] = df['away_team'].astype(str).str.strip().str.upper()
    
    # Critical step: Time Series Sort
    df = df.sort_values('match_date').reset_index(drop=True)
    return df
