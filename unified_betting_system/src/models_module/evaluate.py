import numpy as np
from sklearn.metrics import accuracy_score, log_loss, brier_score_loss
from src.utils import setup_logger

logger = setup_logger(__name__)

def evaluate_model(model, X_test, y_test):
    logger.info("Evaluating Mathematical Calibration...")
    
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)
    
    acc = accuracy_score(y_test, preds)
    ll = log_loss(y_test, probs)
    
    logger.info(f"Accuracy: {acc*100:.2f}% | Log Loss: {ll:.4f}")
    
    if hasattr(model, 'classes_') and 0 in model.classes_:
        class_0_idx = list(model.classes_).index(0)
        prob_home_win = probs[:, class_0_idx]
        actual_home_win = (y_test == 0).astype(int)
        brier = brier_score_loss(actual_home_win, prob_home_win)
        logger.info(f"Home Win Brier Score: {brier:.4f}")
        
    return probs
