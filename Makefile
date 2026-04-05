SHELL := /bin/bash
PYTHON ?= python3

.PHONY: help dev build start lint data train predict bet report

help:
	@echo "AI-Bet root orchestrator"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  dev      - Start Next.js development server"
	@echo "  build    - Build the Next.js app for production"
	@echo "  start    - Start the production server"
	@echo "  lint     - Run ESLint for the frontend stack"
	@echo "  data     - Run the feature/data pipeline"
	@echo "  train    - Train or validate the model"
	@echo "  predict  - Run model inference / predictions"
	@echo "  bet      - Execute the betting engine flow"
	@echo "  report   - Generate reporting/reconciliation outputs"

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

data:
	$(PYTHON) ai_pipeline/build_features.py

train:
	$(PYTHON) unified_betting_system/train_model.py --input data/features.parquet --output-model unified_betting_system/models/model_v1.joblib

predict:
	$(PYTHON) unified_betting_system/run_betting_engine.py

bet:
	$(PYTHON) unified_betting_system/run_system.py

report:
	$(PYTHON) mlops_loop/run_ai_loop.py --predictions data/predictions.parquet --bets data/bets.parquet --results data/results.csv --features data/features.parquet
