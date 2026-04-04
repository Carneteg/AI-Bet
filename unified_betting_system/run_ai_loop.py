import argparse
import sys
import pandas as pd
from src.utils import setup_logger
from src.ai_loop.reconcile import reconcile_bets
from src.ai_loop.drift import detect_feature_drift
from src.ai_loop.retrain import train_challenger
from src.ai_loop.compare import fight_models
from src.ai_loop.registry import ModelRegistry
from src.ai_loop.report import ReportGenerator
from src.models_module.evaluate import evaluate_model

logger = setup_logger("MLOPS_LOOP")

def grade_history(df_preds, df_results):
    df = reconcile_bets(df_preds, df_results)
    if df.empty: return {}
    hit_rate = df['bet_won'].mean()
    y_true = (df['winning_selection'] == 'Home Win').astype(int)
    y_prob = df['home_win_prob']
    from sklearn.metrics import brier_score_loss, log_loss
    brier = brier_score_loss(y_true, y_prob) if len(y_true) > 0 else 0
    return {'hit_rate': hit_rate, 'brier_score_home': brier, 'log_loss': 99.0}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--predictions", type=str, required=True)
    parser.add_argument("--bets", type=str, required=True)
    parser.add_argument("--results", type=str, required=True)
    parser.add_argument("--features", type=str, required=True)
    parser.add_argument("--models-dir", type=str, default="models/")
    parser.add_argument("--reports-dir", type=str, default="reports/")
    parser.add_argument("--force-retrain", type=bool, default=False)
    args = parser.parse_args()

    registry = ModelRegistry(args.models_dir)
    reporter = ReportGenerator(args.reports_dir)

    try:
        df_preds = pd.read_parquet(args.predictions)
        df_results = pd.read_csv(args.results)
        df_feats = pd.read_parquet(args.features)
    except Exception as e:
        logger.error(f"IO Error: {e}")
        return

    champ_metrics = grade_history(df_preds, df_results)
    drift = detect_feature_drift(df_feats)
    
    arena_status = "Skipped"
    champ_v = registry.metadata.get('champion', {}).get('version', 'None') if registry.metadata.get('champion') else 'None'

    if drift['drift_detected'] or args.force_retrain or champ_v == 'None':
        challenger, chall_metrics = train_challenger(df_feats)
        if challenger:
            promoted = fight_models(champ_metrics, chall_metrics)
            if promoted:
                champ_v = registry.register(challenger, chall_metrics, is_champion=True)
                arena_status = "Challenger Promoted."
            else:
                registry.register(challenger, chall_metrics, is_champion=False)
                arena_status = "Champion Defended."
                
    report = reporter.build(champ_metrics, drift, arena_status, champ_v)
    logger.info(f"Loop Terminated. See {report}")

if __name__ == "__main__":
    main()
