import argparse
import logging
import sys
import pandas as pd
from tabulate import tabulate

from src.risk import RiskManager
from src.engine import BetEngine
from src.portfolio import PortfolioBuilder
from src.backtest import Backtester

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )

def main():
    parser = argparse.ArgumentParser(description="Live Quantitative Betting Execution Engine")
    parser.add_argument("--input", type=str, required=True, help="Path to CSV containing predictions vs odds.")
    parser.add_argument("--bankroll", type=float, default=10000.0, help="Current bankroll size.")
    parser.add_argument("--max-bets", type=int, default=5, help="Maximum number of bets to make today.")
    parser.add_argument("--ev-threshold", type=float, default=0.03, help="Minimum EV required to even consider a bet.")
    parser.add_argument("--kelly-fraction", type=float, default=0.25, help="Kelly multiplier (0.25 = Quarter Kelly).")
    parser.add_argument("--output", type=str, default="bets_generated.csv", help="Output file for generated bets.")
    
    args = parser.parse_args()
    setup_logging()
    logger = logging.getLogger("MAIN")

    logger.info(f"╔═════════════════════════════════════════════════════════════╗")
    logger.info(f"║ QUANTITATIVE BETTING ENGINE STARTED                         ║")
    logger.info(f"║ Bankroll: ${args.bankroll:<10,.2f} | Kelly Fraction: {args.kelly_fraction:<14} ║")
    logger.info(f"╚═════════════════════════════════════════════════════════════╝\n")

    try:
        df = pd.read_csv(args.input)
    except FileNotFoundError:
        logger.error(f"Could not find input file: {args.input}")
        sys.exit(1)

    risk_manager = RiskManager(bankroll=args.bankroll, kelly_fraction=args.kelly_fraction)
    engine = BetEngine(risk_manager=risk_manager, min_ev=args.ev_threshold)
    portfolio_manager = PortfolioBuilder(max_daily_bets=args.max_bets)

    all_candidate_bets = []

    # 1. Row by Row Prediction Analysis
    for _, row in df.iterrows():
        probs = {
            'home_win': row['home_win_prob'],
            'draw': row['draw_prob'],
            'away_win': row['away_win_prob']
        }
        odds = {
            'home_win': row['home_odds'],
            'draw': row['draw_odds'],
            'away_win': row['away_odds']
        }
        teams = f"{row['home_team']} vs {row['away_team']}"
        
        # Determine strict mathematical best bet for this match
        bet_decision = engine.evaluate_match_outcomes(row['match_id'], teams, probs, odds)
        
        if bet_decision:
            all_candidate_bets.append(bet_decision)

    # 2. Daily Portfolio Construction
    final_portfolio = portfolio_manager.filter_slate(all_candidate_bets, args.bankroll)

    # 3. Output Generation
    if not final_portfolio:
        logger.warning("\n[!] NO BETS PASSED EV THRESHOLD. Protect your capital. Do not force bets.")
        # We still run backtest if columns exist, but with empty bets
    else:
        portfolio_df = pd.DataFrame(final_portfolio)
        
        # Display nicely in terminal
        display_cols = ['teams', 'selection', 'odds', 'implied_probability', 'model_probability', 'ev', 'stake', 'risk_level']
        logger.info("\n--- RECOMMENDED BETTING PORTFOLIO ---")
        
        # Format for readability
        formatted_df = portfolio_df[display_cols].copy()
        formatted_df['implied_probability'] = (formatted_df['implied_probability'] * 100).map('{:.1f}%'.format)
        formatted_df['model_probability'] = (formatted_df['model_probability'] * 100).map('{:.1f}%'.format)
        formatted_df['ev'] = (formatted_df['ev'] * 100).map('{:.1f}%'.format)
        formatted_df['stake'] = formatted_df['stake'].map('${:,.2f}'.format)
        
        print(tabulate(formatted_df, headers='keys', tablefmt='psql', showindex=False))
        
        portfolio_df.to_csv(args.output, index=False)
        logger.info(f"\n[+] Executable bets exported to {args.output}")

    # 4. Backtest (Academic Verification)
    if 'winning_selection' in df.columns:
        logger.info("\n--- LAUNCHING HISTORICAL BACKTEST ---")
        backtester = Backtester(initial_bankroll=args.bankroll)
        
        if final_portfolio:
            backtester.run_simulation(portfolio_df, df[['match_id', 'winning_selection']])
        else:
            logger.info("No bets to backtest.")

if __name__ == "__main__":
    main()
