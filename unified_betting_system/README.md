# Unified Local AI Betting Ecosystem

This repository is an entirely autonomous, manually-triggered local Python environment encompassing the complete lifecycle of a quantitative sports betting operation. It possesses zero background jobs, zero cloud dependencies, and zero automatic schedulers. 

## 🏗️ Architecture Stack

1. **Crawler (`crawl_soccerway.py`)**: Ethical HTTP data scraper capturing flat match records.
2. **Data Pipeline (`clean_data.py`)**: Normalizes and structures JSON arrays into Parquet matrices.
3. **Feature Engineering (`build_features.py`)**: Prevents Time-Series Leakage by generating rolling averages and Elo scores purely from historical ledgers.
4. **Machine Learning (`train_model.py` / `predict_matches.py`)**: XGBoost and Logistic routines predicting absolute match probabilities.
5. **Quantitative Betting (`run_betting_engine.py`)**: EV detectors and Fractional Kelly modules that restrict Bankroll exposure per game.
6. **MLOps Loop (`run_ai_loop.py`)**: Reconciles history to grade active models, flags mathematical drift, and pits a newly trained Challenger vs the active Champion to safeguard performance.

## 🚀 Execution Pipeline

**1. Scrape Reality**
`python crawl_soccerway.py --seed-url https://www.soccerway.com/ --max-matches 50 --output data/raw_matches.jsonl`

**2. Clean the Data**
`python clean_data.py --input data/raw_matches.jsonl --output data/clean_matches.parquet`

**3. Generate Mathematical Features**
`python build_features.py --input data/clean_matches.parquet --output data/features.parquet`

**4. Train the Champion Model**
`python train_model.py --input data/features.parquet --target match_result --model xgboost --output-model models/champion.joblib`

**5. Predict Live Odds**
`python predict_matches.py --model models/champion.joblib --input data/upcoming_features.parquet --output data/predictions.parquet`

**6. Execute Financial Decisions**
`python run_betting_engine.py --predictions data/predictions.parquet --odds data/odds.csv --bankroll 10000 --output data/bets.csv`

**7. Self-Diagnose the System (Weekly/Monthly)**
`python run_ai_loop.py --predictions data/predictions.parquet --bets data/bets.csv --results data/results.csv --features data/features.parquet --models-dir models/ --reports-dir reports/`

---
*Note: Make sure to review the `reports/` folder frequently to check your Brier Scores.*
