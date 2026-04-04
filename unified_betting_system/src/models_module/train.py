import pandas as pd
import numpy as np
import joblib
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression
from src.utils import setup_logger

logger = setup_logger(__name__)

class ModelTrainer:
    def __init__(self, model_type: str = "xgboost"):
        self.model_type = model_type.lower()
        if self.model_type == "xgboost":
            self.model = XGBClassifier(
                max_depth=4, 
                learning_rate=0.05, 
                n_estimators=200, 
                objective='multi:softprob',
                eval_metric='mlogloss',
                random_state=42
            )
        else:
            self.model = LogisticRegression(max_iter=1000, multi_class='multinomial')

    def train(self, df: pd.DataFrame, target: str, test_size: float = 0.2):
        df_sorted = df.sort_values('match_date').dropna(subset=[target])
        split_idx = int(len(df_sorted) * (1 - test_size))
        
        train_df = df_sorted.iloc[:split_idx]
        test_df = df_sorted.iloc[split_idx:]
        
        if len(train_df) < 50:
            logger.error("Insufficient data for training.")
            return None, None, None
            
        ignore_cols = ['match_id', 'match_date', 'target_match_result', 'target_over_2_5', 'home_team', 'away_team']
        features = [c for c in df.columns if c not in ignore_cols]
        
        X_train = train_df[features]
        y_train = train_df[target]
        X_test = test_df[features]
        y_test = test_df[target]
        
        logger.info(f"Training {self.model_type} on {len(X_train)} matches with {len(features)} features...")
        self.model.fit(X_train, y_train)
        
        if self.model_type == "xgboost":
            importance = self.model.feature_importances_
            sorted_idx = np.argsort(importance)[::-1]
            logger.info("--- Top 5 Features ---")
            for i in range(min(5, len(sorted_idx))):
                logger.info(f"{features[sorted_idx[i]]}: {importance[sorted_idx[i]]:.4f}")
                
        return self.model, X_test, y_test
        
    def save(self, output_path: str):
        joblib.dump(self.model, output_path)
        logger.info(f"Model serialized safely to {output_path}")
