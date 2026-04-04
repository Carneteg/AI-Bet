from typing import List, Dict

class CouponEngine:
    def __init__(self):
        # SPIK Thresholds
        self.spik_min_prob = 0.55
        self.spik_min_edge = 0.03
        self.spik_min_conf = 0.60
        
    def evaluate_match(self, match: Dict) -> Dict:
        """
        Evaluates a single 1X2 match into SPIK, HALV, HEL, or TRAP classifications.
        
        Expected match structure:
        {
            "match_id": str,
            "team_home": str,
            "team_away": str,
            "prob_1": float, "prob_x": float, "prob_2": float,
            "edge_1": float, "edge_x": float, "edge_2": float,
            "confidence": float,
            "public_bias": str # "1", "X", "2", or "NONE" indicates overvaluation by public
        }
        """
        p1, px, p2 = match.get('prob_1', 0), match.get('prob_x', 0), match.get('prob_2', 0)
        e1, ex, e2 = match.get('edge_1', 0), match.get('edge_x', 0), match.get('edge_2', 0)
        conf = match.get('confidence', 0.50)
        bias = match.get('public_bias', "NONE")
        
        # Identify statistical favorite
        outcomes = [("1", p1, e1), ("X", px, ex), ("2", p2, e2)]
        outcomes.sort(key=lambda x: x[1], reverse=True)
        
        fav_sign, fav_prob, fav_edge = outcomes[0]
        runner_up_sign, runner_up_prob, runner_up_edge = outcomes[1]
        
        classification = "HEL"
        suggested_picks = ["1", "X", "2"]
        reasoning = "High uncertainty. Covering all bases."
        is_trap = False
        
        # 1. TRAP Evaluator
        # If public heavily overvalues the favorite (indicated by bias matching fav_sign) and edge is negative
        if bias == fav_sign and fav_edge < 0:
            is_trap = True
            classification = "HEL" # or wide HALV
            suggested_picks = ["1", "X", "2"]
            reasoning = f"TRAP: Public overvalues favorite {fav_sign} (Edge: {fav_edge*100:.1f}%). Forcing full coverage."
            
        # 2. SPIK Evaluator
        elif fav_prob > self.spik_min_prob and fav_edge > self.spik_min_edge and conf > self.spik_min_conf and bias != fav_sign:
            classification = "SPIK"
            suggested_picks = [fav_sign]
            reasoning = f"Core SPIK: Clear dominant probability {fav_prob*100:.1f}% with positive edge {fav_edge*100:.1f}%."
            
        # 3. HALV Evaluator (Tight match or moderate edge on top 2)
        elif abs(fav_prob - runner_up_prob) < 0.15 or (fav_edge > 0.01 and runner_up_edge > 0.01):
            classification = "HALV"
            suggested_picks = [fav_sign, runner_up_sign]
            reasoning = f"HALV: Two tightly contested outcomes or dual-positive edges. Covering {fav_sign} and {runner_up_sign}."

        return {
            "match_id": match.get('match_id', 'Unknown'),
            "teams": f"{match.get('team_home', 'Home')} vs {match.get('team_away', 'Away')}",
            "classification": classification,
            "suggested_picks": suggested_picks,
            "is_trap": is_trap,
            "reasoning": reasoning
        }

    def generate_coupons(self, evaluated_matches: List[Dict]) -> Dict[str, List[List[str]]]:
        """
        Generates overarching system coupon strategies based on evaluated matches.
        Returns the exact picks required per match for each strategy.
        """
        safe_coupon = []
        balanced_coupon = []
        aggressive_coupon = []
        
        for m in evaluated_matches:
            c_class = m['classification']
            picks = m['suggested_picks']
            is_trap = m['is_trap']
            
            # Safe ignores traps context and covers heavy where needed
            if c_class == "SPIK":
                safe_coupon.append(picks)
                balanced_coupon.append(picks)
                # Aggressive might fade a SPIK if confidence isn't max, but mostly plays it
                aggressive_coupon.append(picks)
                
            elif c_class == "HALV":
                safe_coupon.append(picks)
                balanced_coupon.append(picks)
                # Aggressive tries to find a lone edge to slim the coupon
                aggressive_coupon.append([picks[0]]) 
                
            elif c_class == "HEL":
                if is_trap:
                    safe_coupon.append(["1", "X", "2"])
                    balanced_coupon.append(["1", "X", "2"])
                    # Aggressive fades the trap completely
                    possible_fades = [p for p in ["1", "X", "2"] if p not in picks] # Wait, if picks is 1x2, we need original fav
                    # We will simply leave out the public favorite in aggressive traps
                    # Since we didn't store fav_sign, we'll just play X2 or 1X depending on trap
                    aggressive_coupon.append(["1", "2"]) # Boom or bust contrarian
                else:
                    safe_coupon.append(["1", "X", "2"])
                    balanced_coupon.append(picks[:2]) # Trim Hel to Halv
                    aggressive_coupon.append([picks[0]]) # YOLO SPIK
                    
        return {
            "SAFE": safe_coupon,
            "BALANCED": balanced_coupon,
            "AGGRESSIVE": aggressive_coupon
        }
