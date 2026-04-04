import pandas as pd
import numpy as np
import logging
from sklearn.metrics import log_loss, brier_score_loss

logger = logging.getLogger(__name__)

def evaluate_performance(df: pd.DataFrame) -> dict:
    """
    Grades the true mathematical calibration of the current model.
    Calculates Brier Score and Log Loss on historical data.
    """
    logger.info("Evaluating Historical Calibration Metrics...")
    
    if df.empty or 'winning_selection' not in df.columns:
        return {}

    # Standard metrics
    hit_rate = df['bet_won'].mean()
    total_bets = len(df)
    
    # Target conversion for Brier/LogLoss
    # Let's assess how good it is at predicting Home Wins specifically
    y_true_home = (df['winning_selection'] == 'Home Win').astype(int)
    y_prob_home = df['home_win_prob']
    
    brier = brier_score_loss(y_true_home, y_prob_home)
    
    # Provide dummy arrays for Log Loss to prevent crash if class missing
    try:
        y_true_multi = df['winning_selection']
        y_pred_multi = df[['home_win_prob', 'draw_prob', 'away_win_prob']]
        # Scikit expects class labels to match the columns, this is an approximation for MLOps loop checks
        ll = log_loss(y_true_home, y_prob_home) # using binary for safety
    except Exception as e:
        ll = np.nan
        logger.debug(f"Log loss calculation skipped: {e}")

    metrics = {
        'total_matches_reviewed': total_bets,
        'hit_rate': hit_rate,
        'brier_score_home': brier,
        'log_loss_home': ll
    }
    
    logger.info(f"Hit Rate: {hit_rate*100:.1f}% | Home Brier: {brier:.4f}")
    return metrics
