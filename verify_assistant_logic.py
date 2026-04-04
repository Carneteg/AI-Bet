from unified_betting_system.src.betting.betting_system import BettingSystem

def test_assistant_discipline():
    # Initialize system with 10k SEK bankroll
    system = BettingSystem(bankroll=10000.0)
    
    # Test Match 1: Fails Edge Gate (3.9%)
    match_fail_edge = {
        "home_team": "Team A", "away_team": "Team B",
        "home_odds": 2.0, "home_win_prob": 0.539, # Edge = 0.539 - 0.5 = 0.039 (3.9%)
        "confidence": 0.65, "data_quality": 0.95
    }
    res1 = system.process_match(match_fail_edge)
    print(f"Test 1 (Edge 3.9%): {res1['decision']} - Reason: {res1.get('reasoning')}")

    # Test Match 2: Fails Confidence Gate (0.57)
    match_fail_conf = {
        "home_team": "Team C", "away_team": "Team D",
        "home_odds": 2.0, "home_win_prob": 0.55, # Edge = 5% (Passes)
        "confidence": 0.57, # Fails < 0.58
        "data_quality": 0.95
    }
    res2 = system.process_match(match_fail_conf)
    print(f"Test 2 (Conf 0.57): {res2['decision']} - Reason: {res2.get('reasoning')}")

    # Test Match 3: High Grade (Score 6)
    # EV = 0.65 * 1.8 - 1 = 0.17 (17%) -> +3 points
    # Conf = 0.65 -> +1 point
    # Data Quality = 0.95 -> +1 point
    # Scorecard needs +1 more for HIGH (6)
    # Let's verify Scorecard thresholds (6/4/2)
    match_high = {
        "home_team": "Elite", "away_team": "Underdog",
        "home_odds": 1.8, "home_win_prob": 0.65, 
        "confidence": 0.66, # +2
        "data_quality": 0.95, # +1
        "lineup_confirmed": True # +1
    }
    # Total Score = 3 (EV 17%) + 2 (Conf 66%) + 1 (Data) + 1 (Lineup) = 7 (HIGH)
    res3 = system.process_match(match_high)
    print(f"Test 3 (Score 7): {res3['decision']} - Grade: {res3.get('scorecard_grade')} - Stake: {res3.get('stake_amount')} SEK")

if __name__ == "__main__":
    test_assistant_discipline()
