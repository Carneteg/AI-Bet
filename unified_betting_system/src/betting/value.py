from typing import Dict, Optional
from src.utils import setup_logger

logger = setup_logger(__name__)

class ValueDetector:
    def __init__(self):
        # Explicit user-provided constraints
        self.min_data_quality = 0.90
        self.min_edge = 0.04
        self.min_confidence = 0.58

    def evaluate(self, odds: float, prob: float, confidence: float = 1.0, data_quality: float = 1.0, segment_roi: float = 0.05) -> Optional[Dict]:
        """
        Calculates Edge and EV while aggressively enforcing the Golden Rule sequence.
        """
        if odds <= 1.0 or prob <= 0:
            return None
            
        implied_prob = 1.0 / odds
        edge = prob - implied_prob
        ev = (prob * odds) - 1.0
        
        # 1. Data Quality Enforcement
        if data_quality < self.min_data_quality:
            logger.debug(f"PASS: Insufficient data quality ({data_quality:.2f} < {self.min_data_quality})")
            return None
            
        # 2. Mathematical Edge Enforcement
        elif edge < self.min_edge:
            logger.debug(f"PASS: Insufficient mathematical edge ({edge:.3f} < {self.min_edge})")
            return None
            
        # 3. Model Confidence Enforcement
        elif confidence < self.min_confidence:
            logger.debug(f"PASS: Insufficient confidence score ({confidence:.2f} < {self.min_confidence})")
            return None
            
        # 4. Segment ROI Filter
        elif segment_roi < 0:
            logger.warning(f"MARGINAL PLAY: Segment ROI is negative ({segment_roi:.2f}%). Flagging for stake reduction.")
            stake_multiplier = 0.5  # Halve the stake if playing into a losing segment
        else:
            stake_multiplier = 1.0  # Bet with controlled stake
            
        return {
            "odds": odds,
            "model_prob": prob,
            "implied_prob": implied_prob,
            "edge": edge,
            "ev": ev,
            "stake_multiplier": stake_multiplier
        }
