import pandas as pd
import numpy as np
import logging
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, log_loss, brier_score_loss

logger = logging.getLogger(__name__)

def train_baseline_model(df: pd.DataFrame, test_size: float = 0.2):
    """
    Trains a robust XGBoost tree classifier mapping on-field features + market steam.
    """
    logger.info("Initializing XGBoost Machine Learning Engine...")
    
    # 1. Chronological Split
    df_sorted = df.sort_values('match_date')
    split_idx = int(len(df_sorted) * (1 - test_size))
    
    train_df = df_sorted.iloc[:split_idx]
    test_df = df_sorted.iloc[split_idx:]
    
    logger.info(f"Train Set: {len(train_df)} matches. Test Set: {len(test_df)} matches.")
    
    features = [c for c in df.columns if c not in ['match_date', 'target_match_result', 'target_over_2_5']]
    
    X_train = train_df[features]
    y_train = train_df['target_match_result']
    X_test = test_df[features]
    y_test = test_df['target_match_result']
    
    if len(np.unique(y_train)) < 2:
        logger.error("Not enough classes strictly present in train set to build a model.")
        return
    
    # 2. Train XGBoost
    # Parameters meticulously tuned to prevent overfitting on sports variance.
    # XGBoost natively ignores NaN variables (e.g. if a match lacked odds data) implicitly
    clf = XGBClassifier(
        max_depth=4, 
        learning_rate=0.05, 
        n_estimators=200, 
        objective='multi:softprob',
        eval_metric='mlogloss',
        random_state=42
    )
    clf.fit(X_train, y_train)
    
    # 3. Predict & Evaluate
    preds = clf.predict(X_test)
    probs = clf.predict_proba(X_test)
    
    acc = accuracy_score(y_test, preds)
    ll = log_loss(y_test, probs)
    
    logger.info("--- MODEL EVALUATION ---")
    logger.info(f"Accuracy: {acc:.4f} (Base hit rate)")
    logger.info(f"Log Loss: {ll:.4f}")
    
    # Extrapolate Home Win (Class 0 usually)
    if hasattr(clf, 'classes_') and 0 in clf.classes_:
        class_0_idx = list(clf.classes_).index(0)
        prob_home_win = probs[:, class_0_idx]
        actual_home_win = (y_test == 0).astype(int)
        brier = brier_score_loss(actual_home_win, prob_home_win)
        logger.info(f"Brier Score (Home Win Calibration): {brier:.4f} (Closer to 0 is better)")
        
    # Feature Importance
    logger.info("\n--- FEATURE IMPORTANCE ---")
    importance = clf.feature_importances_
    sorted_idx = np.argsort(importance)[::-1]
    
    for i in sorted_idx:
        logger.info(f"{features[i]:<25}: {importance[i]:.4f}")
