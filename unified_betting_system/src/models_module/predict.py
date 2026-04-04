import pandas as pd
import joblib
import logging
from src.utils import setup_logger

logger = setup_logger(__name__)

def predict_probabilities(model_path: str, df: pd.DataFrame) -> pd.DataFrame:
    """Loads binary model and attaches multi-class prediction probabilities."""
    logger.info(f"Loading instantiated model from {model_path}")
    try:
        model = joblib.load(model_path)
    except FileNotFoundError:
        logger.error("Model binary not found.")
        return df

    ignore_cols = ['match_id', 'match_date', 'target_match_result', 'target_over_2_5', 'home_team', 'away_team']
    features = [c for c in df.columns if c not in ignore_cols]
    
    X = df[features]
    
    if X.empty:
        logger.warning("No valid features passed for prediction.")
        return df
        
    probs = model.predict_proba(X)
    
    # Secure class mapping
    classes = list(model.classes_)
    
    res_df = df.copy()
    if 0 in classes:
        res_df['home_win_prob'] = probs[:, classes.index(0)]
    if 1 in classes:
        res_df['draw_prob'] = probs[:, classes.index(1)]
    if 2 in classes:
        res_df['away_win_prob'] = probs[:, classes.index(2)]
        
    return res_df
