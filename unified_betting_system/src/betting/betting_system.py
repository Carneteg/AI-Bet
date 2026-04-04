from typing import Dict, List, Any
import pandas as pd
from src.betting.decision_engine import DecisionEngine
from src.betting.scorecard import BetScorecard
from src.betting.stake_engine import StakeEngine
from src.betting.no_bet_filter import NoBetFilter
from src.utils import setup_logger

logger = setup_logger(__name__)

class BettingSystem:
    def __init__(self, bankroll: float):
        self.bankroll = bankroll
        
        # Initialize Core Modules
        self.no_bet_filter = NoBetFilter()
        self.decision_engine = DecisionEngine(exposure_limit=0.05)
        self.scorecard = BetScorecard()
        self.stake_engine = StakeEngine()

    def process_match(self, match: Dict[str, Any], current_daily_exposure: float = 0.0) -> Dict[str, Any]:
        """
        Processes an individual match payload through the full evaluation pipeline.
        """
        match_str = f"{match.get('home_team', 'Home')} vs {match.get('away_team', 'Away')}"
        
        odds = match.get('odds', 0.0)
        prob = match.get('model_probability', 0.0)
        
        if odds <= 1.0 or prob <= 0.0:
            return self._build_pass_output(match_str, "Invalid odds or probability structures.")

        # 1. Base Arithmetic
        implied_prob = 1.0 / odds
        edge = prob - implied_prob
        ev = (prob * odds) - 1.0
        
        confidence = match.get('confidence', 0.60)
        data_qual = match.get('data_quality', 0.95)
        movement = match.get('odds_movement', 0.0)
        missing_data = match.get('missing_data_flag', False)
        
        # 2. Run Strict Filter
        nbf_res = self.no_bet_filter.evaluate(
            edge=edge, ev=ev, confidence=confidence, 
            data_quality=data_qual, odds_movement=movement, missing_data_flag=missing_data
        )
        if nbf_res['decision'] == "PASS":
            return self._build_pass_output(match_str, f"Filter Rejected: {nbf_res['reason']}")
            
        # 3. Decision Engine Check
        dec_res = self.decision_engine.evaluate_bet(
            model_probability=prob, odds=odds, 
            confidence_score=confidence, data_quality_score=data_qual, 
            segment_roi=match.get('segment_roi', 0.05),
            current_exposure=current_daily_exposure
        )
        if dec_res['decision'] == "PASS":
            return self._build_pass_output(match_str, f"Decision Engine Rejected: {dec_res['reasoning']}")

        # Determine structural bet size from engine
        overall_decision = dec_res['decision'] # BET or SMALL_BET
        
        # If no_bet_filter flagged REDUCE because of steam, we can override to SMALL_BET
        if nbf_res['decision'] == "REDUCE":
            overall_decision = "SMALL_BET"

        # 4. Quantitative Scorecard
        score_res = self.scorecard.grade(
            ev=ev, confidence=confidence,
            clv_signal=match.get('clv_signal', 0.0),
            lineup_confirmed=match.get('lineup_confirmed', False),
            public_bias=match.get('public_bias', False),
            data_quality=data_qual,
            odds_movement=movement,
            uncertainty_flag=match.get('uncertainty_flag', False)
        )
        classification = score_res['classification']
        if classification == "PASS":
            return self._build_pass_output(match_str, "Scorecard grade collapsed below viability baseline.")
            
        # 5. Stake Calculations
        # If the overall_decision cascaded down to SMALL_BET, we cap the confidence grade passed to Risk engine
        if overall_decision == "SMALL_BET" and classification in ["HIGH", "MEDIUM"]:
            classification = "LOW"
            
        stake_res = self.stake_engine.calculate(
            bankroll=self.bankroll, probability=prob, odds=odds, 
            confidence_level=classification, current_daily_exposure=current_daily_exposure
        )
        
        if stake_res['stake_amount'] <= 0:
            return self._build_pass_output(match_str, "Stake engine dictated zero capital deployment.")

        # 6. Output Delivery
        return {
            "match": match_str,
            "decision": overall_decision,
            "scorecard_grade": score_res['classification'],
            "ev": round(ev, 4),
            "edge": round(edge, 4),
            "confidence": round(confidence, 4),
            "stake_amount": stake_res['stake_amount'],
            "stake_percent": stake_res['stake_percent'],
            "reasoning": f"Passed Gateways. Graded {score_res['classification']}. {stake_res['explanation']}"
        }

    def _build_pass_output(self, match_str: str, reasoning: str) -> Dict[str, Any]:
        return {
            "match": match_str,
            "decision": "PASS",
            "ev": 0.0,
            "edge": 0.0,
            "confidence": 0.0,
            "stake_amount": 0.0,
            "stake_percent": 0.0,
            "reasoning": reasoning
        }
        
    def evaluate_slate(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        current_exp = 0.0
        
        for m in matches:
            res = self.process_match(m, current_daily_exposure=current_exp)
            if res['decision'] != "PASS":
                # Increment exposure so downstream picks adjust correctly
                current_exp += (res['stake_amount'] / self.bankroll)
            results.append(res)
            
        return results
