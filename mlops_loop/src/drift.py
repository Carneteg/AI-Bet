import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

def detect_feature_drift(df_features: pd.DataFrame, threshold: float = 0.2) -> dict:
    """
    Simulates a Population Stability Index (PSI) style drift check.
    If the features of the last 20% of the dataset radically differ in mean/std
    from the first 80%, it triggers a drift warning.
    """
    logger.info("Running Data Drift Diagnostics...")
    
    if len(df_features) < 50:
        logger.warning("Dataset too small to reliably calculate drift.")
        return {'drift_detected': False, 'warnings': []}
        
    df_sorted = df_features.sort_values(by='match_date')
    
    split_idx = int(len(df_sorted) * 0.8)
    history = df_sorted.iloc[:split_idx]
    recent = df_sorted.iloc[split_idx:]
    
    # Check numeric columns only
    num_cols = df_features.select_dtypes(include=[np.number]).columns
    # Ignore targets and dates
    ignore = ['target_match_result', 'target_over_2_5']
    cols_to_check = [c for c in num_cols if c not in ignore]
    
    warnings = []
    
    for c in cols_to_check:
        hist_mean = history[c].mean()
        rec_mean = recent[c].mean()
        
        if hist_mean == 0 or np.isnan(hist_mean) or np.isnan(rec_mean):
            continue
            
        # Calculate percentage shift
        shift = abs(hist_mean - rec_mean) / abs(hist_mean)
        
        if shift > threshold:
            warnings.append(f"Feature '{c}' shifted by {shift*100:.1f}% (Hist: {hist_mean:.2f} -> Rec: {rec_mean:.2f})")
            
    is_drifting = len(warnings) > 0
    
    if is_drifting:
        logger.warning(f"Drift Detected in {len(warnings)} features. Model retraining highly recommended.")
        for w in warnings:
            logger.warning(f" - {w}")
    else:
        logger.info("Feature distributions are stable.")
        
    return {
        'drift_detected': is_drifting,
        'warnings': warnings
    }
