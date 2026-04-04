import argparse
import pandas as pd
import sys
import os
import json
from src.ai_loop.performance_reviewer import PerformanceReviewer
from src.utils.bankroll_manager import BankrollManager
from src.crawler.result_crawler import ResultCrawler

def print_header(text: str):
    print(f"\n{'='*60}")
    print(f" {text}")
    print(f"{'='*60}")

def main():
    parser = argparse.ArgumentParser(description="Betting Performance Reviewer - Post-Match Audit")
    parser.add_argument("--ledger", type=str, required=True, help="Path to the execution ledger / daily report CSV")
    parser.add_argument("--results", type=str, help="Optional: JSON string of results {'Match Name': 'Result'}")
    parser.add_argument("--auto", action="store_true", help="Attempt to fetch results automatically from crawler")
    
    args = parser.parse_args()

    if not os.path.exists(args.ledger):
        print(f"Error: Ledger file {args.ledger} not found.")
        sys.exit(1)
        
    df = pd.read_csv(args.ledger)
    bets = df.to_dict(orient="records")

    reviewer = PerformanceReviewer()
    bank_manager = BankrollManager()
    crawler = ResultCrawler()
    
    outcomes = {}
    if args.results:
        outcomes = json.loads(args.results)
    else:
        print("\n--- Processing Match Results (1, X, 2) ---")
        for b in bets:
            m_name = b.get('Match') or b.get('match')
            pick = b.get('Rec. Pick') or b.get('bet')
            
            res = None
            if args.auto:
                if " vs " in m_name:
                    h, a = m_name.split(" vs ")
                    res = crawler.get_match_outcome(h.strip(), a.strip())
            
            if not res:
                res = input(f"Result for {m_name} (Bet: {pick}): ").strip().upper()
                
            outcomes[m_name] = res

    # STEP 2: AUDIT
    audit_data = reviewer.audit_slate(bets, outcomes)
    detailed = audit_data['detailed_results']
    summary = audit_data['summary']

    # STEP 3: UPDATE BANKROLL
    bank_manager.update_bankroll(summary['net_pnl'])
    
    # NEW: Export to Web App Stats Bridge
    web_data_dir = os.path.join(os.path.dirname(__file__), "app", "data")
    if not os.path.exists(web_data_dir):
        web_data_dir = os.path.join("app", "data")
    
    os.makedirs(web_data_dir, exist_ok=True)
    web_stats_path = os.path.join(web_data_dir, "performance_stats.json")
    
    import json
    # Attempt to load existing history or start fresh
    history = []
    if os.path.exists(web_stats_path):
        try:
            with open(web_stats_path, 'r') as hf:
                history = json.load(hf)
                if isinstance(history, dict): history = [history] # Convert old format
        except: pass
        
    history.append({
        "timestamp": pd.Timestamp.now().isoformat(),
        "daily_pnl": summary['net_pnl'],
        "bankroll": bank_manager.data['current_bankroll'],
        "roi": summary['roi'],
        "hit_rate": summary['hit_rate'],
        "detailed": detailed
    })
    
    with open(web_stats_path, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=2)

    # STEP 4: OUTPUT IN 3 SECTIONS
    
    # 1. Results Table
    print_header("1. RESULTS TABLE")
    df_results = pd.DataFrame(detailed)
    print(df_results.to_string(index=False))

    # 2. Daily Summary
    print_header("2. DAILY SUMMARY")
    print(f"Total Stake:   {summary['total_stake']} SEK")
    print(f"Total Return:  {summary['total_return']} SEK")
    print(f"Profit/Loss:   {summary['net_pnl']} SEK")
    print(f"Hit Rate:      {summary['hit_rate']*100:.1f}%")
    print(f"ROI:           {summary['roi']:.1f}%")
    print(f"New Bankroll:  {bank_manager.data['current_bankroll']} SEK")

    # 3. Lessons for Tomorrow
    print_header("3. LESSONS FOR TOMORROW")
    lessons = []
    
    good_proc_bad_res = [d for d in detailed if d['Classification'] == reviewer.GOOD_PROC_BAD_RES]
    bad_proc_good_res = [d for d in detailed if d['Classification'] == reviewer.BAD_PROC_GOOD_RES]
    
    if good_proc_bad_res:
        lessons.append(f"- **Variance Check**: {len(good_proc_bad_res)} bets had good process but bad results. Do not over-adjust; the math is sound.")
    if bad_proc_good_res:
        lessons.append(f"- **Lucky Warning**: {len(bad_proc_good_res)} bets were 'Bad Process' but won. Do not let result bias encourage poor discipline.")
    
    if summary['roi'] > 0:
        lessons.append("- **Discipline**: Profit confirmed today. Carry the same 4% Edge floor into tomorrow.")
    elif summary['roi'] < 0:
        lessons.append("- **Resilience**: A down day is part of the long game. The 4% floor protects us from deeper drawdowns.")
    else:
        lessons.append("- **Standard Performance**: Process and result aligned. Execution remains optimal.")
        
    for l in lessons:
        print(l)

    print("\n[FINISH] Performance Review Complete.")

if __name__ == "__main__":
    main()
