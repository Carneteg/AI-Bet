import pandas as pd
from src.coupon_strategist.coupon_engine import CouponEngineV2

def run_coupon_analysis(match_data: list):
    engine = CouponEngineV2()
    
    # 1. Generate Classifications
    classifications = [engine.classify_match(m) for m in match_data]
    
    # 2. Build Table 1 - Match classification
    df_class = pd.DataFrame(classifications)
    # Reorder/Rename for cleaner output
    df_output = df_class[['match', 'best_pick', 'type', 'confidence', 'reason']].copy()
    df_output.columns = ['Match', 'Best pick', 'Type', 'Confidence', 'Reason']
    
    print("\n### Table – Match classification")
    print(df_output.to_string(index=False))
    
    # 3. Generate Coupon Versions
    coupons = engine.build_coupons(classifications)
    
    print("\n### Generate 3 coupon versions:")
    print(f"1. **SAFE**: {coupons['SAFE']}")
    print(f"2. **BALANCED**: {coupons['BALANCED']}")
    print(f"3. **AGGRESSIVE**: {coupons['AGGRESSIVE']}")
    
    # 4. Strategy Notes
    print("\n### Strategy Notes")
    print("- **Attack Variance**: The Aggressive coupon slims down HALVs to SPIKs on value edges to increase potential payout.")
    print("- **Protect against Bias**: TRAPs (Public overvalued favorites) are covered or faded in Balanced/Aggressive versions.")

if __name__ == "__main__":
    # Mock data for demonstration (representing the example matches)
    mock_matches = [
        {
            "home_team": "Arsenal", "away_team": "Everton",
            "home_win_prob": 0.72, "draw_prob": 0.18, "away_win_prob": 0.10,
            "home_edge": 0.03, "draw_edge": -0.05, "away_edge": -0.08,
            "confidence": 0.65,
            "home_streck": 82, "draw_streck": 12, "away_streck": 6 # Public favorite (82% vs 72% model)
        },
        {
            "home_team": "Chelsea", "away_team": "Liverpool",
            "home_win_prob": 0.35, "draw_prob": 0.25, "away_win_prob": 0.40,
            "home_edge": -0.02, "draw_edge": 0.01, "away_edge": 0.04,
            "confidence": 0.62,
            "home_streck": 30, "draw_streck": 25, "away_streck": 45
        }
    ]
    run_coupon_analysis(mock_matches)
