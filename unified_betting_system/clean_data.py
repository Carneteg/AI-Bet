import argparse
import os
from src.utils import setup_logger
from src.data_pipeline.loader import load_jsonl
from src.data_pipeline.cleaner import clean_data
from src.data_pipeline.normalizer import normalize_data

logger = setup_logger("DATA_PIPELINE")

def main():
    parser = argparse.ArgumentParser(description="Football Match Data Cleaner")
    parser.add_argument("--input", type=str, required=True, help="Input raw JSONL file")
    parser.add_argument("--output", type=str, default="data/clean_matches.parquet", help="Output Parquet path")
    args = parser.parse_args()

    df_raw = load_jsonl(args.input)
    if df_raw.empty:
        logger.error("No data loaded. Exiting.")
        return

    df_clean = clean_data(df_raw)
    df_norm = normalize_data(df_clean)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    df_norm.to_parquet(args.output, index=False)
    logger.info(f"Successfully exported {len(df_norm)} normalized matches to {args.output}")

if __name__ == "__main__":
    main()
