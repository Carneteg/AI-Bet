import pandas as pd
import logging

logger = logging.getLogger(__name__)

def calculate_implied_probability(odds: float) -> float:
    """Converts European Decimal Odds to Implied Probability."""
    if odds <= 1.0:
        return 1.0 # Protect against bad data
    return 1.0 / odds

def calculate_ev(model_prob: float, odds: float) -> float:
    """Calculates Mathematical Expected Value."""
    # EV = Proft_if_win - Loss_if_lose
    # EV = (model_prob * (odds - 1)) - ( (1 - model_prob) * 1 )
    # Mathematically simplifies to:
    return (model_prob * odds) - 1.0

def evaluate_value(model_prob: float, odds: float, min_ev_threshold: float = 0.03) -> dict:
    """
    Given a model probability and live odds, determines if value exists.
    Returns the edge characteristics if it clears the threshold, otherwise None.
    """
    implied = calculate_implied_probability(odds)
    edge = model_prob - implied
    ev = calculate_ev(model_prob, odds)
    
    if ev > min_ev_threshold:
        return {
            'implied_prob': implied,
            'edge': edge,
            'ev': ev,
            'is_value': True
        }
    return {
        'implied_prob': implied,
        'edge': edge,
        'ev': ev,
        'is_value': False
    }
