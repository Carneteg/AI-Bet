# Machine Learning Data Pipeline for Football Analysis

This standalone Python project ingests raw match data crawled from web scraping systems (JSONL) and engineers flat, leakage-free feature matrices ready for direct ingestion into classification models like `Logistic Regression` and `XGBoost`.

## Core Pipeline Architecture:

1. **Loader & Cleaner**: Strict enforcement of chronology. Matches without scores or bad data are dropped. The dataset is explicitly sorted by `Date` so the arrow of time is never violated.
2. **Elo Generation**: Iterates through the matches row-by-row simulating a real-time K-factor Elo update. This ensures pre-match elo scores are generated solely based on history available before kickoff.
3. **Rolling Averages**: The `features.py` generator aggregates past 5 performances (e.g. Points Form, Average Goals, Shots) and maps them to today's match using Pandas `.shift(1)`. This guarantees 0 future data leakage.
4. **Target Variables**: Adds labels for `home_win`, `draw`, `away_win`, and `over_2.5_goals`.
5. **Model Baseline**: Built-in Logistic Regression capabilities to benchmark accuracy and Brier Scores.

## Execution

Ensure you are using a Python 3.9+ environment.
```bash
cd ai_pipeline
pip install -r requirements.txt
python build_features.py --input ../soccerway_scraper/data/output.jsonl --output data/features.parquet --train-model
```
