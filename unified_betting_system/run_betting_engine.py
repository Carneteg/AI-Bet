import argparse
import os
import pandas as pd
from src.utils import setup_logger
from src.betting.engine import BettingEngine

logger = setup_logger("BETTING_ENGINE")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--predictions", type=str, required=True, help="Predictions parquet")
    parser.add_argument("--odds", type=str, required=True, help="Market odds csv")
    parser.add_argument("--bankroll", type=float, default=10000.0, help="Bankroll constraint")
    parser.add_argument("--output", type=str, default="data/bets.csv", help="Bet ledger output")
    args = parser.parse_args()

    df_preds = pd.read_parquet(args.predictions)
    # Use pandas to read odds, default to csv, fallback to parquet if needed
    try:
        df_odds = pd.read_csv(args.odds)
    except Exception:
        df_odds = pd.read_parquet(args.odds)

    engine = BettingEngine(bankroll=args.bankroll)
    approved_bets = engine.run(df_preds, df_odds)
    
    if approved_bets:
        df_out = pd.DataFrame(approved_bets)
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        df_out.to_csv(args.output, index=False)
        logger.info(f"Exported {len(approved_bets)} sanctioned edges to {args.output}")
    else:
        logger.info("No edges found. Zero capital deployed.")

if __name__ == "__main__":
    main()
