import pandas as pd
import numpy as np
import logging
from xgboost import XGBClassifier
from sklearn.metrics import log_loss, brier_score_loss

logger = logging.getLogger(__name__)

def train_challenger(df: pd.DataFrame, test_size: float = 0.2):
    """
    Spins up a fresh XGBoost instance and trains on the entire dataset.
    Returns the Challenger model and the exact holdout predictions for the Arena.
    """
    logger.info("Retraining Challenger XGBoost Model...")
    
    df_sorted = df.sort_values('match_date')
    split_idx = int(len(df_sorted) * (1 - test_size))
    
    train_df = df_sorted.iloc[:split_idx]
    test_df = df_sorted.iloc[split_idx:]
    
    features = [c for c in df.columns if c not in ['match_date', 'target_match_result', 'target_over_2_5']]
    
    # We must drop NaN rows specifically for the target variable to avoid crashes
    train_df = train_df.dropna(subset=['target_match_result'])
    test_df = test_df.dropna(subset=['target_match_result'])
    
    if len(train_df) < 50:
        logger.error("Not enough clean data to train a challenger.")
        return None, None, None

    X_train = train_df[features]
    y_train = train_df['target_match_result']
    X_test = test_df[features]
    y_test = test_df['target_match_result']
    
    # Instantiate Challenger (Same params as AI Pipeline baseline)
    challenger = XGBClassifier(
        max_depth=4, 
        learning_rate=0.05, 
        n_estimators=200, 
        objective='multi:softprob',
        eval_metric='mlogloss',
        random_state=42
    )
    
    logger.info("Challenger learning new distributions...")
    challenger.fit(X_train, y_train)
    
    # Generate holdout predictions for the Arena
    probs = challenger.predict_proba(X_test)
    
    # Extrapolate Home Win (Class 0 usually) for Brier
    class_0_idx = list(challenger.classes_).index(0)
    prob_home_win = probs[:, class_0_idx]
    actual_home_win = (y_test == 0).astype(int)
    
    brier = brier_score_loss(actual_home_win, prob_home_win)
    ll = log_loss(y_test, probs)
    
    metrics = {
        'brier_score': brier,
        'log_loss': ll
    }
    logger.info(f"Challenger Metrics -> Brier: {brier:.4f} | LogLoss: {ll:.4f}")
    
    return challenger, metrics, X_test
