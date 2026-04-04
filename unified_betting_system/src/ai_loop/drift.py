import pandas as pd
import numpy as np
from src.utils import setup_logger

logger = setup_logger(__name__)

def detect_feature_drift(df_features: pd.DataFrame, threshold: float = 0.20) -> dict:
    logger.info("Running Mathematical Feature Drift Diagnostics...")
    
    if len(df_features) < 100:
        logger.warning("Dataset too small for reliable PSI/drift calculations.")
        return {'drift_detected': False, 'warnings': []}
        
    df_sorted = df_features.sort_values(by='match_date')
    split_idx = int(len(df_sorted) * 0.8)
    history = df_sorted.iloc[:split_idx]
    recent = df_sorted.iloc[split_idx:]
    
    num_cols = df_features.select_dtypes(include=[np.number]).columns
    ignore = ['target_match_result', 'target_over_2_5']
    cols_to_check = [c for c in num_cols if c not in ignore]
    
    warnings = []
    
    for c in cols_to_check:
        hist_mean = history[c].mean()
        rec_mean = recent[c].mean()
        
        if hist_mean == 0 or np.isnan(hist_mean) or np.isnan(rec_mean):
            continue
            
        shift = abs(hist_mean - rec_mean) / abs(hist_mean)
        if shift > threshold:
            warnings.append(f"{c} shifted geometrically by {shift*100:.1f}%")
            
    is_drifting = len(warnings) > 0
    if is_drifting:
        logger.warning(f"Feature Drift detected globally in {len(warnings)} parameters.")
    else:
        logger.info("Market features appear statistically stationary.")
        
    return {'drift_detected': is_drifting, 'warnings': warnings}
