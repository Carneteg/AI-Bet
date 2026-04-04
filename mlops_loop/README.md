# MLOps Local Learning Loop

This manual architecture oversees the health and integrity of your ML models over time. It continuously grades bets, watches for mathematical drift in the underlying football market, and forces a newly trained "Challenger" model to fight your active "Champion" model before safely upgrading your codebase.

## Execution

Ensure you are using a Python 3.9+ environment.
```bash
cd mlops_loop
pip install -r requirements.txt
python run_ai_loop.py --predictions ../betting_engine/data/example_predictions.csv --features ../ai_pipeline/data/features.parquet --force-retrain True
```
