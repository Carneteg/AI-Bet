from src.utils import setup_logger

logger = setup_logger(__name__)

def fight_models(champ_metrics: dict, chall_metrics: dict) -> bool:
    logger.info("\n--- THE ARENA (CHAMPION vs CHALLENGER) ---")
    
    if not champ_metrics or 'log_loss' not in champ_metrics:
        logger.info("No Champion Log-Loss found. Challenger theoretically wins by default.")
        return True
        
    c_ll = champ_metrics.get('log_loss', 99.0)
    ch_ll = chall_metrics.get('log_loss', 99.0)
    
    logger.info(f"Log Loss: Champion ({c_ll:.4f}) vs Challenger ({ch_ll:.4f})")
    
    if ch_ll < c_ll:
        logger.info("⚔️ Challenger defeated Champion.")
        return True
    
    logger.info("🛡️ Champion defended title.")
    return False
