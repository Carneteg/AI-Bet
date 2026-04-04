from typing import List, Dict, Any
import pandas as pd

class PerformanceReviewer:
    def __init__(self):
        # 4 process-result classifications
        self.GOOD_PROC_GOOD_RES = "good process, good result"
        self.GOOD_PROC_BAD_RES = "good process, bad result"
        self.BAD_PROC_GOOD_RES = "bad process, good result"
        self.BAD_PROC_BAD_RES = "bad process, bad result"

    def _parse_num(self, val: Any) -> float:
        if isinstance(val, (int, float)):
            return float(val)
        s = str(val).replace('%', '').replace(' SEK', '').strip()
        try:
            return float(s) / 100.0 if '%' in str(val) else float(s)
        except:
            return 0.0

    def classify_decision(self, bet_data: Dict[str, Any], actual_result: str) -> str:
        """
        Classifies the quality of the decision independent of the outcome.
        """
        # Case-insensitive key mapping with robust parsing
        edge = self._parse_num(bet_data.get('Edge') or bet_data.get('edge', 0))
        ev = self._parse_num(bet_data.get('EV') or bet_data.get('ev', 0))
        bet_pick = str(bet_data.get('Rec. Pick') or bet_data.get('bet') or bet_data.get('Bet'))
        
        is_good_process = edge >= 0.04 and ev >= 0.03
        is_good_result = bet_pick == actual_result
        
        if is_good_process and is_good_result:
            return self.GOOD_PROC_GOOD_RES
        elif is_good_process and not is_good_result:
            return self.GOOD_PROC_BAD_RES
        elif not is_good_process and is_good_result:
            return self.BAD_PROC_GOOD_RES
        else:
            return self.BAD_PROC_BAD_RES

    def audit_slate(self, bets: List[Dict[str, Any]], outcomes: Dict[str, str]) -> Dict[str, Any]:
        """
        Processes a list of bets and their actual results.
        """
        results = []
        total_stake = 0.0
        total_return = 0.0
        wins = 0
        
        for bet in bets:
            m_id = bet.get('Match') or bet.get('match')
            actual = outcomes.get(m_id)
            if not actual:
                continue
                
            # Handle Ledger CSV column names
            stake_str = bet.get('Stake') or bet.get('stake_amount', "0")
            stake = float(str(stake_str).replace(' SEK', '').strip())
            
            # Need original odds for calculation
            # If not in ledger, we might need a better reconciliation
            odds = float(bet.get('Odds') or bet.get('odds', 2.0)) 
            
            bet_pick = str(bet.get('Rec. Pick') or bet.get('bet'))
            is_win = bet_pick == actual
            
            pnl = (stake * odds - stake) if is_win else -stake
            ret = (stake * odds) if is_win else 0.0
            
            total_stake += stake
            total_return += ret
            if is_win: wins += 1
            
            results.append({
                "Match": m_id,
                "Bet": bet_pick,
                "Result": actual,
                "Stake": stake,
                "PnL": pnl,
                "Classification": self.classify_decision(bet, actual)
            })
            
        summary = {
            "total_stake": total_stake,
            "total_return": total_return,
            "net_pnl": total_return - total_stake,
            "hit_rate": wins / len(results) if results else 0,
            "roi": ((total_return - total_stake) / total_stake) * 100 if total_stake > 0 else 0
        }
        
        return {"detailed_results": results, "summary": summary}
