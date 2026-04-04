import argparse
import os
import json
import pandas as pd
from src.utils import setup_logger
from src.betting.backtest import Backtester

logger = setup_logger("BACKTEST")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bets", type=str, required=True, help="Historical bets ledger")
    # For a real backtest we need the actual results to verify. If none provided, assume bets file has the results merged.
    parser.add_argument("--results", type=str, required=False, help="Historical ground truth results")
    parser.add_argument("--output", type=str, default="reports/backtest_report.json", help="Report dump")
    args = parser.parse_args()

    df_bets = pd.read_csv(args.bets)
    if args.results:
        df_results = pd.read_csv(args.results)
    else:
        # Assuming the bets DF already holds the truth in "home_score" and "away_score" for simulation
        df_results = df_bets.copy()

    tester = Backtester(initial_bankroll=10000.0)
    report = tester.simulate(df_bets, df_results)
    
    if report:
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=4)
        logger.info(f"Report exported cleanly to {args.output}")

if __name__ == "__main__":
    main()
