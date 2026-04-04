# Quantitative Betting Engine

This isolated Python module converts probabilistic machine-learning predictions into mathematically rigorous, risk-constrained capital allocations using the exact formulas leveraged by sharp betting syndicates.

## Core Mechanics
1. **Value Detection**: Discards bad bets by isolating scenarios where the AI-predicted probability is significantly higher than the implied probability derived from live bookmaker odds (+EV).
2. **Capital Rules**: Allocates precise monetary unit stakes using a **Fractional Kelly Criterion**. This dynamically assigns higher stakes to higher-value opportunities while rigorously defending the overall bankroll against heavy downswings. It prevents overexposure by enforcing maximum 5% daily portfolio risk limits.
3. **Simulation**: Provides backtesting capabilities to theoretically measure system profitability (ROI, Max Drawdown) across historical periods before ever risking real money.

## Execution

Ensure you are using a Python 3.9+ environment.
```bash
cd betting_engine
pip install -r requirements.txt
python run_betting_engine.py --input data/example_predictions.csv --bankroll 10000 --ev-threshold 0.03
```
