import argparse
import os
import pandas as pd
from src.utils import setup_logger
from src.models_module.train import ModelTrainer
from src.models_module.evaluate import evaluate_model

logger = setup_logger("TRAINING")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, required=True)
    parser.add_argument("--target", type=str, default="target_match_result")
    parser.add_argument("--model", type=str, default="xgboost")
    parser.add_argument("--output-model", type=str, default="models/model_v1.joblib")
    args = parser.parse_args()

    df = pd.read_parquet(args.input)
    trainer = ModelTrainer(model_type=args.model)
    model, X_test, y_test = trainer.train(df, args.target)
    
    if model is not None:
        evaluate_model(model, X_test, y_test)
        os.makedirs(os.path.dirname(os.path.abspath(args.output_model)), exist_ok=True)
        trainer.save(args.output_model)

if __name__ == "__main__":
    main()
