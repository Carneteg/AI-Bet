import pandas as pd
import logging

logger = logging.getLogger(__name__)

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw scraped data into a chronological, mathematically viable base ledger.
    Crucial for preventing time-series leakage.
    """
    if df.empty:
        return df
        
    logger.info("Executing Date conversions and row cleaning...")
    
    # 1. Date Conversion
    if 'date' in df.columns:
        # Convert date safely. Soccerway dates can be chaotic.
        df['match_date'] = pd.to_datetime(df['date'], errors='coerce')
    else:
        logger.error("No 'date' column found. Time-series operations will fail.")
        return pd.DataFrame()

    # 2. Extract numeric scores safely
    if 'home_score_full' in df.columns and 'away_score_full' in df.columns:
        df['home_score'] = pd.to_numeric(df['home_score_full'], errors='coerce')
        df['away_score'] = pd.to_numeric(df['away_score_full'], errors='coerce')
    else:
        df['home_score'] = None
        df['away_score'] = None

    # 3. Drop unplayed matches or matches missing scores
    initial_len = len(df)
    df = df.dropna(subset=['match_date', 'home_score', 'away_score'])
    logger.info(f"Dropped {initial_len - len(df)} rows due to missing critical score or date data.")
    
    # 4. Standardize Team Names (Strip whitespace)
    df['home_team'] = df['home_team'].astype(str).str.strip().str.upper()
    df['away_team'] = df['away_team'].astype(str).str.strip().str.upper()
    
    # 5. VERY IMPORTANT: Chronological Sort
    # We MUST process the dataframe strictly moving forward in time to generate rolling features.
    df = df.sort_values('match_date')
    df = df.reset_index(drop=True)
    
    logger.info("Data sorted chronologically. Ready for feature engineering.")
    return df
