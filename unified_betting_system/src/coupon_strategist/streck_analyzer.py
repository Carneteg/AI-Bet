import pandas as pd
from typing import Dict, Optional
from src.utils import setup_logger

logger = setup_logger(__name__)

class StreckAnalyzer:
    def __init__(self, value_threshold: float = 0.05):
        """
        Calculates discrepancy between Model Probability and Public Streck %.
        value_threshold indicates the minimum edge required to declare pure value.
        """
        self.value_threshold = value_threshold

    def evaluate_edge(self, true_prob: float, streck_pct: float) -> float:
        """
        Calculates mathematical edge. 
        Positive Edge: Public is undervaluing the outcome.
        Negative Edge: Public is overvaluing the outcome (Trap).
        """
        if streck_pct <= 0: return 0.0
        return true_prob - streck_pct

    def classify_confidence(self, edge: float, true_prob: float) -> str:
        """Assigns strict confidence level based on true probability and EV."""
        if edge < -0.15:
            return "Very Low" # Massively overvalued trap
        if edge > 0.10 and true_prob > 0.45:
            return "High" 
        if edge > 0.05:
            return "Medium"
        return "Low"

    def assign_stake(self, confidence: str) -> float:
        """Assigns stake based strictly on Bankroll System Rules."""
        mapping = {
            "Very Low": 0.0,
            "Low": 0.5,
            "Medium": 1.0,
            "High": 1.5,
            "Max": 2.0
        }
        return mapping.get(confidence, 0.0)
