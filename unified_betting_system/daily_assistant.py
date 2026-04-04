import argparse
import pandas as pd
import sys
import os
import json
from typing import List, Dict, Any

from src.betting.betting_system import BettingSystem
from src.coupon_strategist.coupon_engine import CouponEngineV2
from src.utils.bankroll_manager import BankrollManager
from src.utils.vision_extractor import VisionExtractor
from src.crawler.svenska_spel_fetcher import SvenskaSpelFetcher

def print_header(text: str):
    print(f"\n{'='*60}")
    print(f" {text}")
    print(f"{'='*60}")

def main():
    parser = argparse.ArgumentParser(description="AI Football Betting Assistant (Disciplined Analyst Protocol)")
    parser.add_argument("--pool", type=str, choices=['stryktipset', 'europatipset', 'topptipset'], help="Fetch live data from Svenska Spel")
    parser.add_argument("--image", type=str, help="Ingest via Vision AI (Screenshot)")
    parser.add_argument("--input", type=str, help="Ingest via CSV file")
    parser.add_argument("--bankroll", type=float, help="Override current bankroll (default: 10,000)")
    
    args = parser.parse_args()

    # STEP 1: READ TODAY'S MATCHES (Ingestion)
    matches = []
    
    if args.pool:
        print(f"[*] Fetching live pool data: {args.pool}...")
        fetcher = SvenskaSpelFetcher()
        matches = fetcher.fetch_pool(args.pool)
        if not matches:
            print("Error: Could not retrieve match data via API or Scraper.")
            sys.exit(1)
        print(f"[+] Successfully ingested {len(matches)} matches.")
    elif args.image:
        print(f"[*] Analyzing image: {args.image}...")
        extractor = VisionExtractor()
        matches = extractor.extract_from_image(args.image)
    elif args.input:
        if not os.path.exists(args.input):
            print(f"Error: Match file {args.input} not found.")
            sys.exit(1)
        if args.input.endswith('.json'):
            with open(args.input, 'r', encoding='utf-8') as f:
                matches = json.load(f)
        else:
            df = pd.read_csv(args.input)
            matches = df.to_dict(orient="records")
    else:
        print("Error: Please specify --pool, --image, or --input.")
        sys.exit(1)

    # Initialize Engine
    bank_manager = BankrollManager()
    if args.bankroll: bank_manager.data["current_bankroll"] = args.bankroll
    
    bankroll_val = bank_manager.data["current_bankroll"]
    betting_system = BettingSystem(bankroll=bankroll_val)
    coupon_engine = CouponEngineV2()

    # STEP 1.5: NORMALIZE KEYS
    normalized_matches = []
    for m in matches:
        norm = {k.lower().replace(' ', '_'): v for k, v in m.items()}
        # Handle 'match' string split
        if 'match' in norm and ' - ' in str(norm['match']):
            teams = norm['match'].split(' - ')
            norm['home_team'] = teams[0]
            norm['away_team'] = teams[1]
        normalized_matches.append(norm)

    # STEPS 2-5: ANALYZE, FILTER, SCORE, STAKE
    raw_results = betting_system.evaluate_slate(normalized_matches)
    
    analysis_data = [] # Table 1
    pass_list = []     # Table 3
    daily_exposure = 0.0
    
    for res in raw_results:
        # Step 3: FILTER GATE (4% Edge, 3% EV, 0.58 Confidence)
        if res['decision'] == 'PASS':
            pass_list.append({"Match": res['match'], "Why": res['reasoning']})
        else:
            # Step 5: STAKING (0.5u, 1u, 1.5u, 2u)
            # 1 Unit = 1% Bankroll (100 SEK)
            daily_exposure += res['stake_amount']
            
            # Map to Table 1 format
            analysis_data.append({
                "Product": args.pool.upper() if args.pool else "1X2",
                "Match": res['match'],
                "Spel": res['bet'],
                "Odds": res['odds'],
                "Prob": f"{round(res['confidence']*100)}%",
                "Edge": f"{(res['edge']*100):.1f}%",
                "EV": f"{(res['ev']*100):.1f}%",
                "Confidence": res['scorecard_grade'],
                "Beslut": "SPELA",
                "Insats": f"{res['stake_amount']} kr ({res['stake_units']}u)",
                "Motivering": res['reasoning'][:40] + "..."
            })

    # STEP 6: KUPONGLOGIK
    # Enrich matches with streck for pool classification
    classifications = []
    for m in matches:
        m['home_win_prob'] = m.get('home_win_prob', 0.5) # Fallback
        classifications.append(coupon_engine.classify_match(m))
        
    coupons = coupon_engine.build_coupons(classifications)

    # STEP 7: OUTPUT - ALWAYS TABLES
    # Table 1: Match Analysis
    df1 = pd.DataFrame(analysis_data) if analysis_data else pd.DataFrame(columns=["Match", "Beslut", "Reason"])
    
    # Table 2: Coupon Proposals
    def r_rows(s): return 1 # Mock row count
    df2 = pd.DataFrame([{
        "Produkt": args.pool.upper() if args.pool else "N/A",
        "SAFE system": f"{coupons['SAFE']}",
        "BALANCED system": f"{coupons['BALANCED']}",
        "AGGRESSIVE system": f"{coupons['AGGRESSIVE']}"
    }])

    # Table 3: Pass List
    df3 = pd.DataFrame(pass_list) if pass_list else pd.DataFrame(columns=["Match", "Why"])

    # Table 4: Daily Summary
    actionable = [d for d in classifications if d['type'] != 'PASS']
    anchors = [d for d in classifications if d['type'] == 'SPIK']
    traps = [d for d in classifications if d['type'] == 'TRAP']
    
    summary_items = {
        "Bästa spik": anchors[0]['match'] if anchors else "N/A",
        "Bästa skräll": actionable[-1]['match'] if actionable else "N/A",
        "Största fällan": traps[0]['match'] if traps else "N/A",
        "Bästa no-bet": pass_list[0]['Match'] if pass_list else "N/A"
    }
    df4 = pd.DataFrame([summary_items])

    # DISPLAY
    print_header("DAILY FOOTBALL BETTING ASSISTANT - EXECUTION LEDGER")
    
    print("\n### TABELL 1 – MATCHANALYS")
    print(df1.to_string(index=False))
    
    print("\n### TABELL 2 – KUPONGFÖRSLAG")
    print(df2.to_string(index=False))
    
    print("\n### TABELL 3 – PASS-LISTA")
    print(df3.to_string(index=False))
    
    print("\n### TABELL 4 – DAGSSUMMERING")
    print(df4.to_string(index=False))

    # WEB DATA UPDATE
    web_data_path = os.path.join("app", "data", "latest_analysis.json")
    os.makedirs(os.path.dirname(web_data_path), exist_ok=True)
    with open(web_data_path, 'w', encoding='utf-8') as f:
        json.dump({
            "analysis": df1.to_dict(orient="records"),
            "coupons": df2.to_dict(orient="records"),
            "pass_list": df3.to_dict(orient="records"),
            "summary": summary_items,
            "timestamp": pd.Timestamp.now().isoformat()
        }, f, indent=2)
    
    total_exp_pct = (daily_exposure / bankroll_val) * 100
    print(f"\n[FINISH] Analysis complete. Total Exposure: {total_exp_pct:.1f}%. Web updated.")

if __name__ == "__main__":
    main()
