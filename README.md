# AI-Bet

AI-driven Stryktips analysis web app built with Next.js, Tailwind CSS, and Python-powered modeling pipelines.

## Overview

AI-Bet combines a modern Next.js frontend with data and modeling pipelines for live football and harness racing analysis. The application can run in a fallback mode using mock data, or in live mode when API keys are configured.

## Architecture

- `app/` - Next.js frontend and server routes
- `components/` - React UI components
- `lib/` - shared TypeScript business logic and data helpers
- `data/` - fallback fixtures, static match and racing data
- `ai_pipeline/` - feature engineering and data preparation scripts
- `unified_betting_system/` - prediction and betting strategy pipelines
- `betting_engine/` - standalone betting engine utilities
- `mlops_loop/` - model monitoring, drift detection, and reporting

## Quickstart

1. Install dependencies

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

3. Start the development server

```bash
make dev
```

4. Open the app at `http://localhost:3000`

## Recommended workflows

- `make dev` — run the web app in development mode
- `make build` — build the frontend for production
- `make start` — start the built app
- `make data` — run the feature/data pipeline
- `make train` — train a model artifact
- `make predict` — run inference or prediction workflow
- `make bet` — execute the betting engine flow
- `make report` — generate reconciliation and reporting outputs

## Environment variables

Use `.env.example` as the source of truth for required and optional runtime secrets.

- `FOOTBALL_DATA_API_KEY` — required for live football match data
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — required for image analysis
- `NEXT_PUBLIC_ATG_API` — optional switch for live ATG racing data

## Notes

- The repo supports both fallback and live data modes.
- Root config is centralized through `lib/config.ts`.
- Improvement recommendations are tracked in `docs/IMPROVEMENT_AUDIT.md`.
