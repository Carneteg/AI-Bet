import argparse
import logging
import sys
import pandas as pd
import os

from src.reconcile import reconcile_bets
from src.evaluate import evaluate_performance
from src.drift import detect_feature_drift
from src.registry import ModelRegistry
from src.retrain import train_challenger
from src.compare import fight_models
from src.report import ReportGenerator

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )

def main():
    parser = argparse.ArgumentParser(description="Local MLOps Loop for Sports Betting")
    parser.add_argument("--predictions", type=str, required=True, help="Path to predictions csv")
    parser.add_argument("--features", type=str, required=True, help="Path to raw engineered features parquet")
    parser.add_argument("--force-retrain", type=bool, default=False, help="Force the Arena regardless of drift")
    
    args = parser.parse_args()
    setup_logging()
    logger = logging.getLogger("MAIN")

    logger.info("=========================================")
    logger.info("   🤖 INITIATING MLOPS LEARNING LOOP     ")
    logger.info("=========================================\n")

    registry = ModelRegistry()
    reporter = ReportGenerator()
    
    # Ensure current champion exists
    champ_metadata = registry.metadata.get('champion')
    champ_version = champ_metadata['version'] if champ_metadata else "None"
    
    logger.info(f"Active Champion Model: v{champ_version}")

    try:
        preds_df = pd.read_csv(args.predictions)
        features_df = pd.read_parquet(args.features)
    except FileNotFoundError as e:
        logger.error(f"Input file missing: {e}")
        sys.exit(1)

    # 1. Reconcile & Grade History
    reconciled_df = reconcile_bets(preds_df)
    champion_metrics = evaluate_performance(reconciled_df)

    # 2. Check for Feature/Market Drift
    drift_output = detect_feature_drift(features_df)

    arena_result_str = "No Arena match triggered."

    # 3. The Arena (Champion vs Challenger)
    if drift_output['drift_detected'] or args.force_retrain:
        logger.info("Retraining sequence activated.")
        
        challenger_model, challenger_metrics, _ = train_challenger(features_df)
        
        if challenger_model:
            # Fight
            promoted = fight_models(champion_metrics, challenger_metrics)
            
            if promoted:
                new_v = registry.save_model(challenger_model, challenger_metrics, is_champion=True)
                arena_result_str = f"CHALLENGER PROMOTED! Replaced v{champ_version} with v{new_v}"
                champ_version = new_v
            else:
                archived_v = registry.save_model(challenger_model, challenger_metrics, is_champion=False)
                arena_result_str = f"CHALLENGER DEFEATED. Champion v{champ_version} retains title. Challenger archived as v{archived_v}"
        else:
            arena_result_str = "Challenger failed to train (insufficient data/NaNs)."
            
    # 4. Generate Report
    report_path = reporter.generate(champion_metrics, drift_output, arena_result_str, champ_version)
    
    logger.info("=========================================")
    logger.info(f"Loop Complete. Report exported to: {report_path}")
    logger.info("=========================================")

if __name__ == "__main__":
    main()
