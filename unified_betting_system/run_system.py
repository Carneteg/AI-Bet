import argparse
import pandas as pd
import sys
import os
from src.utils import setup_logger
from src.betting.betting_system import BettingSystem

logger = setup_logger("CLI_RUN_SYSTEM")

def _load_data(filepath: str) -> pd.DataFrame:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Input file not found: {filepath}")
        
    ext = os.path.splitext(filepath)[1].lower()
    if ext == '.csv':
        return pd.read_csv(filepath)
    elif ext == '.parquet':
        return pd.read_parquet(filepath)
    else:
        raise ValueError(f"Unsupported file format '{ext}'. Must be .csv or .parquet")

def main():
    parser = argparse.ArgumentParser(description="CLI Runner for the AI Betting System")
    parser.add_argument("--input", type=str, required=True, help="Path to input match data (.csv or .parquet)")
    parser.add_argument("--bankroll", type=float, required=True, help="Current available bankroll")
    parser.add_argument("--output", type=str, required=True, help="Path to save execution ledger (.csv)")

    args = parser.parse_args()

    try:
        logger.info(f"Loading input data from {args.input}")
        df = _load_data(args.input)
        
        matches = df.to_dict(orient="records")
        logger.info(f"Loaded {len(matches)} matches successfully.")
        
        system = BettingSystem(bankroll=args.bankroll)
        results = system.evaluate_slate(matches)
        
        # Filter purely to matches where we are placing capital
        actionable_bets = [r for r in results if r.get('decision') != "PASS"]
        
        if actionable_bets:
            output_df = pd.DataFrame(actionable_bets)
            output_df.to_csv(args.output, index=False)
            logger.info(f"Execution complete. Filtered down to {len(actionable_bets)} actionable wagers.")
            logger.info(f"Ledger safely exported to: {args.output}")
        else:
            logger.warning("Zero bets passed the quantitative filters today. No output generated.")
            # Still generate a blank DataFrame just so strict pipelines don't fail looking for the file
            pd.DataFrame(columns=["match", "decision", "scorecard_grade", "ev", "edge", "confidence", "stake_amount", "stake_percent", "reasoning"]).to_csv(args.output, index=False)
            
    except Exception as e:
        logger.error(f"Fatal error during system execution: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
