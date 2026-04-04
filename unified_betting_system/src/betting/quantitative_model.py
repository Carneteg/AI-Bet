import pandas as pd
from typing import List, Dict, Any

class QuantitativeModelEvaluator:
    def evaluate_matches(self, matches: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Accepts a list of raw matches, performs strict expected value mathematics,
        and generates a clean, quantitative evaluation table tracking EV, Edge, and Implied Prob.
        """
        results = []
        for match in matches:
            # Safely extract core data
            home_team = match.get('home_team', 'Unknown Home')
            away_team = match.get('away_team', 'Unknown Away')
            market = match.get('market', '1X2')
            odds = float(match.get('odds', 1.0))
            prob = float(match.get('model_probability', 0.0))
            confidence = float(match.get('confidence_score', 0.50))
            
            # 1. Expected Value Mathematics
            implied_prob = 1.0 / odds if odds > 0 else 0.0
            edge = prob - implied_prob
            ev = (prob * odds) - 1.0 if odds > 1.0 else 0.0
            
            # Format cleanly for output table
            results.append({
                "Match": f"{home_team} vs {away_team}",
                "Market": market,
                "Odds": round(odds, 2),
                "Model probability": round(prob, 4),
                "Implied probability": round(implied_prob, 4),
                "Edge": round(edge, 4),
                "EV": round(ev, 4),
                "Confidence score (0–1)": round(confidence, 2)
            })
            
        return pd.DataFrame(results)

    def print_table(self, matches: List[Dict[str, Any]]):
        """Outputs the required clean table natively to console."""
        df = self.evaluate_matches(matches)
        if df.empty:
            print("No matches to process.")
            return
            
        print("\n" + "="*80)
        print("QUANTITATIVE MODEL EVALUATION TABLE")
        print("="*80)
        print(df.to_string(index=False))
        print("="*80 + "\n")
