import argparse
import pandas as pd
from src.utils import setup_logger
from src.coupon_strategist.svenska_spel_1x2 import SvenskaSpelCoupon
from src.coupon_strategist.markdown_formatter import MarkdownFormatter
import json

logger = setup_logger("COUPON_STRATEGIST")

def main():
    parser = argparse.ArgumentParser(description="Evaluate Coupon EV vs Public Bias")
    parser.add_argument("--coupon-data", type=str, required=True, 
                        help="JSON file containing matches with True Probs and Streck Probs")
    parser.add_argument("--product", type=str, default="Svenska Spel: Stryktipset")
    args = parser.parse_args()

    # Load data
    try:
        with open(args.coupon_data, 'r', encoding='utf-8') as f:
            matches = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load coupon data: {e}")
        return

    logger.info(f"Loaded {len(matches)} matches for {args.product} analysis.")

    # Evaluate
    engine = SvenskaSpelCoupon()
    evaluated_matches = []
    
    for match in matches:
        res = engine.evaluate_match(match)
        evaluated_matches.append(res)
        
    # Format and Output
    formatter = MarkdownFormatter()
    
    report = f"# Quantitative Analysis: {args.product}\n\n"
    report += formatter.format_match_analysis(evaluated_matches, args.product)
    report += formatter.format_system_recommendation(evaluated_matches, args.product)
    report += formatter.format_bankroll(evaluated_matches, args.product)
    report += formatter.format_pass_list(evaluated_matches)

    print("\n" + "="*50)
    print(report)
    print("="*50 + "\n")
    logger.info("Coupon execution complete.")

if __name__ == "__main__":
    main()
