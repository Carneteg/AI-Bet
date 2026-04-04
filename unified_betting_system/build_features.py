import argparse
import os
import pandas as pd
from src.utils import setup_logger
from src.features.elo import generate_elo_features
from src.features.features import compute_rolling_features, compute_market_features
from src.features.dataset import define_targets, build_final_dataset

logger = setup_logger("FEATURES")

def main():
    parser = argparse.ArgumentParser(description="Build Leakage-Free Feature Matrix")
    parser.add_argument("--input", type=str, required=True, help="Path to clean_matches.parquet")
    parser.add_argument("--output", type=str, default="data/features.parquet", help="Path to save features")
    parser.add_argument("--min-matches-per-team", type=int, default=5, help="Rolling window size")
    args = parser.parse_args()

    df = pd.read_parquet(args.input)
    if df.empty:
        logger.error("Empty dataframe provided.")
        return

    # Add mock match_id if it doesn't exist to bridge crawler and betting engine safely
    if 'match_id' not in df.columns:
        df['match_id'] = ["m_" + str(i) for i in range(len(df))]

    df_elo = generate_elo_features(df)
    df_features = compute_rolling_features(df_elo, window=args.min_matches_per_team)
    df_market = compute_market_features(df_features)
    
    df_targets = define_targets(df_market)
    final_dataset = build_final_dataset(df_targets, min_matches=args.min_matches_per_team)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    final_dataset.to_parquet(args.output, index=False)
    logger.info(f"Feature matrix built gracefully -> {args.output}")

if __name__ == "__main__":
    main()
