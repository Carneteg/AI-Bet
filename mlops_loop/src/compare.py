import logging

logger = logging.getLogger(__name__)

def fight_models(champion_metrics: dict, challenger_metrics: dict) -> bool:
    """
    Evaluates whether the Challenger mathematically outperforms the Champion.
    Returns True if Challenger should be promoted.
    """
    logger.info("\n--- THE ARENA (CHAMPION vs CHALLENGER) ---")
    
    # If we have no Champion metrics (first run), Challenger wins by default
    if not champion_metrics or 'log_loss_home' not in champion_metrics:
        logger.info("No valid Champion baseline found. Challenger wins by default.")
        return True
        
    # We compare the Log Loss primarily, then Brier.
    # Lower is better for both.
    champ_ll = champion_metrics.get('log_loss_home', 99.0)
    chall_ll = challenger_metrics.get('log_loss', 99.0)
    
    logger.info(f"Log Loss Matchup: Champion ({champ_ll:.4f}) vs Challenger ({chall_ll:.4f})")
    
    if chall_ll < champ_ll:
        logger.info("⚔️ Challenger outperformed Champion in Log Loss.")
        return True
    else:
        logger.info("🛡️ Champion defended its title. Challenger rejected.")
        return False
