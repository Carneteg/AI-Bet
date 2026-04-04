import argparse
import logging
import sys
import os

from src.loader import load_jsonl
from src.cleaner import clean_data
from src.elo import generate_elo_features
from src.features import compute_rolling_features
from src.dataset import define_targets, build_final_dataset
from src.model import train_baseline_model

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(module)s: %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )

def main():
    parser = argparse.ArgumentParser(description="AI Pipeline to construct leakage-free ML datasets.")
    parser.add_argument("--input", type=str, required=True, help="Input JSONL file containing scraped matches.")
    parser.add_argument("--output", type=str, required=True, help="Output Parquet feature matrix.")
    parser.add_argument("--train-model", action="store_true", help="If flagged, automatically trains a LogReg baseline.")
    parser.add_argument("--test-size", type=float, default=0.2, help="Percentage of chronological data reserved for blind testing.")
    parser.add_argument("--min-matches", type=int, default=5, help="Rolling window size. Rows failing to meet this are dropped.")
    
    args = parser.parse_args()
    setup_logging()
    logger = logging.getLogger("MAIN")

    if not os.path.exists(args.input):
        logger.error(f"Input file not found: {args.input}")
        sys.exit(1)

    logger.info("--- 1. LOAD & CLEAN ---")
    df_raw = load_jsonl(args.input)
    df_clean = clean_data(df_raw)
    
    if df_clean.empty:
        logger.error("Data strictly empty after cleaning. Cannot proceed.")
        sys.exit(1)

    logger.info("--- 2. Elo Generation ---")
    df_elo = generate_elo_features(df_clean)

    logger.info("--- 3. Rolling Time-Series Features ---")
    df_features = compute_rolling_features(df_elo, window=args.min_matches)
    
    logger.info("--- 3b. Market Steam Features ---")
    from src.features import compute_market_features
    df_market = compute_market_features(df_features)

    logger.info("--- 4. Target Generation & Truncation ---")
    df_targets = define_targets(df_market)
    final_dataset = build_final_dataset(df_targets, min_matches=args.min_matches)

    logger.info("--- 5. Dataset Persistence ---")
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    
    # Save as parquet to strictly enforce datatypes for XGBoost/sklearn
    final_dataset.to_parquet(args.output, index=False)
    logger.info(f"Feature matrix serialized successfully -> {args.output}")

    if args.train_model:
        logger.info("--- 6. ML Model Benchmark ---")
        train_baseline_model(final_dataset, test_size=args.test_size)

if __name__ == "__main__":
    main()
