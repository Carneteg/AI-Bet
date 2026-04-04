from typing import List, Dict, Any

class CouponEngineV2:
    def __init__(self):
        # Step 6 Classification Thresholds
        self.spik_min_prob = 0.55
        self.spik_min_edge = 0.03
        self.spik_min_conf = 0.60
        
    def classify_match(self, match: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes Step 6 Classification: SPIK, HALV, HEL, or TRAP.
        """
        home = match.get('home_team', 'Home')
        away = match.get('away_team', 'Away')
        match_str = f"{home} vs {away}"
        
        # 1. Profile Extraction
        p1 = float(match.get('home_win_prob', 0))
        px = float(match.get('draw_prob', 0))
        p2 = float(match.get('away_win_prob', 0))
        
        e1 = float(match.get('home_edge', 0))
        ex = float(match.get('draw_edge', 0))
        e2 = float(match.get('away_edge', 0))
        
        conf = float(match.get('confidence', 0.50))
        # Public bias is often 'streckning' (Swedish pool percentages)
        s1 = float(match.get('home_streck', 0))
        sx = float(match.get('draw_streck', 0))
        s2 = float(match.get('away_streck', 0))

        # Identify favorite and value
        outcomes = [("1", p1, e1, s1), ("X", px, ex, sx), ("2", p2, e2, s2)]
        outcomes.sort(key=lambda x: x[1], reverse=True)
        
        fav_sign, fav_prob, fav_edge, fav_streck = outcomes[0]
        runner_up_sign, runner_up_prob, runner_up_edge, runner_up_streck = outcomes[1]
        
        # 2. TRAP Detection (Overvalued Favorite)
        # Definition: Public overvalues favorite (>10% above model) and edge is negative
        is_trap = False
        if (fav_streck / 100.0) > (fav_prob + 0.10) and fav_edge < 0:
            is_trap = True

        classification = "HEL"
        suggested_picks = "1X2"
        reasoning = "High variance / Low edge environment."

        if is_trap:
            classification = "TRAP"
            suggested_picks = "X2" if fav_sign == "1" else "1X" if fav_sign == "2" else "12"
            reasoning = f"Public overvalues {fav_sign} ({fav_streck}%). Model fades to {suggested_picks}."
            
        elif fav_prob > self.spik_min_prob and fav_edge > self.spik_min_edge and conf > self.spik_min_conf:
            classification = "SPIK"
            suggested_picks = fav_sign
            reasoning = f"Solid mathematical anchor. {fav_prob*100:.0f}% prob with {fav_edge*100:.1f}% edge."
            
        elif abs(fav_prob - runner_up_prob) < 0.15 or fav_edge > 0.01:
            classification = "HALV"
            # Sort top 2 by value if prob is close
            picks = sorted([fav_sign, runner_up_sign])
            suggested_picks = "".join(picks)
            reasoning = "Two outcomes closely matched. Cover both to minimize variance."

        return {
            "match": match_str,
            "best_pick": fav_sign if classification == "SPIK" else suggested_picks,
            "type": classification,
            "confidence": conf,
            "reason": reasoning,
            "picks_list": list(suggested_picks) if classification != "HEL" else ["1", "X", "2"]
        }

    def build_coupons(self, classifications: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        Builds the 3 required coupon versions: SAFE, BALANCED, AGGRESSIVE.
        """
        safe = []
        balanced = []
        aggressive = []

        for c in classifications:
            c_type = c['type']
            picks = c['picks_list']
            
            # SAFE: Maxi-Gardering
            if c_type == "SPIK":
                # Only spike if confidence is very high, otherwise cover
                safe.append("".join(picks) if c['confidence'] > 0.7 else "".join(sorted(picks + ["X"])))
                balanced.append("".join(picks))
                aggressive.append("".join(picks))
            elif c_type == "TRAP":
                safe.append("1X2") # Cover the trap fully
                balanced.append("".join(picks)) # Fade the favorite
                aggressive.append("".join(picks)) # Fade the favorite
            elif c_type == "HALV":
                safe.append("1X2") # Upgrade Halv to Hel
                balanced.append("".join(picks))
                aggressive.append(picks[0]) # Slim to Spik
            else: # HEL
                safe.append("1X2")
                balanced.append("1X2")
                aggressive.append("".join(picks[:1])) # YOLO

        return {
            "SAFE": "-".join(safe),
            "BALANCED": "-".join(balanced),
            "AGGRESSIVE": "-".join(aggressive)
        }
