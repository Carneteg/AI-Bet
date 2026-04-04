import pandas as pd
from src.utils import setup_logger
from src.models_module.train import ModelTrainer
from sklearn.metrics import log_loss, brier_score_loss

logger = setup_logger(__name__)

def train_challenger(df: pd.DataFrame):
    logger.info("Initializing The Arena: Training Challenger Model...")
    trainer = ModelTrainer(model_type="xgboost")
    
    # We use retrain to hit the entire fresh dataset
    model, X_test, y_test = trainer.train(df, target="target_match_result", test_size=0.2)
    
    if not model:
        return None, None
        
    probs = model.predict_proba(X_test)
    ll = log_loss(y_test, probs)
    
    # Extrapolate Home Brier
    classes = list(model.classes_)
    if 0 in classes:
        p_home = probs[:, classes.index(0)]
        t_home = (y_test == 0).astype(int)
        brier = brier_score_loss(t_home, p_home)
    else:
        brier = 99.0
        
    metrics = {'log_loss': ll, 'brier_score': brier}
    logger.info(f"Challenger forged -> LogLoss: {ll:.4f} | Brier: {brier:.4f}")
    
    return model, metrics
