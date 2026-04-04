import argparse
import os
import pandas as pd
from src.utils import setup_logger
from src.models_module.predict import predict_probabilities

logger = setup_logger("PREDICT")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, required=True)
    parser.add_argument("--input", type=str, required=True)
    parser.add_argument("--output", type=str, default="data/predictions.parquet")
    args = parser.parse_args()

    df = pd.read_parquet(args.input)
    res_df = predict_probabilities(args.model, df)
    
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    res_df.to_parquet(args.output, index=False)
    logger.info(f"Probabilities resolved and mapped to {args.output}")

if __name__ == "__main__":
    main()
