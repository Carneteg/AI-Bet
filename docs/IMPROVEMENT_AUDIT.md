# AI-Bet Improvement Audit (April 2026)

This audit identifies concrete, high-impact improvements based on the current repository structure and implementation.

## 1) Foundation & reliability (highest priority)

1. **Add a real project-level onboarding guide.**
   - Root `README.md` is currently a single-line description, while most operational details live in subfolder READMEs.
   - Improve by adding architecture overview, dependency matrix (Node + Python), local setup steps, and "first-run" commands.

2. **Define one canonical execution entrypoint.**
   - Multiple pipelines exist (`ai_pipeline`, `betting_engine`, `mlops_loop`, `unified_betting_system`) with overlapping responsibilities.
   - Introduce a root orchestrator script or `Makefile` with explicit modes (`data`, `train`, `predict`, `bet`, `report`) to reduce drift.

3. **Centralize configuration and secrets handling.**
   - The frontend references fallback/live modes, but there is no clear root env contract.
   - Add `.env.example`, typed config loader(s), and startup validation to fail fast when critical keys are missing.

## 2) Model quality & scientific rigor

4. **Harden time-series evaluation.**
   - The model train split in `unified_betting_system/src/models_module/train.py` is a single chronological split.
   - Add walk-forward validation, calibration checks (Brier/log-loss drift by time bucket), and confidence intervals.

5. **Make heuristic thresholds externally configurable.**
   - Risk and optimization modules include embedded thresholds (e.g. edge/confidence/EV cutoffs).
   - Move all gating values to versioned config files so changes are auditable and tunable without code edits.

6. **Add reproducibility metadata to model artifacts.**
   - Persist model version, feature list hash, training date window, dataset checksum, and metrics alongside each trained model.

## 3) Data pipeline robustness

7. **Add schema contracts between pipeline stages.**
   - Crawler → cleaner → features → model currently depends on implied columns.
   - Introduce schema checks (pandera/pydantic or typed validators) and explicit fail messages for missing/invalid columns.

8. **Instrument data freshness + completeness.**
   - Cache and source status are present for V75 aggregation, but not surfaced as a global health dashboard.
   - Add freshness SLA checks and alert flags for stale, partial, or fallback-heavy data.

9. **Improve source fallback observability.**
   - Aggregation catches enrichment failures and silently returns un-enriched race objects.
   - Record per-race and per-source failure reasons for diagnosis and model confidence penalties.

## 4) Frontend/API product improvements

10. **Standardize API response contracts and localization.**
    - API routes return useful data but mix status detail and locale-specific text.
    - Add shared response types and error codes to improve client-side handling and future internationalization.

11. **Expose model confidence decomposition in UI.**
    - The UI emphasizes value/confidence outputs but gives limited explainability for why a pick is recommended.
    - Add an explainability panel with feature contributions, market-vs-model gap, and uncertainty flags.

## 5) Testing & CI

12. **Introduce layered automated tests.**
    - Add tests at three layers: unit (math/risk), contract (schemas), and backtest regression snapshots.

13. **Add CI quality gates for both TypeScript and Python stacks.**
    - Run lint/typecheck/tests for frontend and all Python modules on every PR.
    - Block merges on failing gates and publish artifact/report summaries.

## 6) Operational safety / responsible betting

14. **Add explicit bankroll guardrails and session limits.**
    - Kelly-based staking exists; augment with hard drawdown stop, daily loss caps, and cooldown logic.

15. **Track post-bet outcomes with model accountability.**
    - Add automatic post-match reconciliation reports: expected vs realized ROI by segment, odds band, and confidence band.

## Suggested execution roadmap

- **Phase 1 (1–2 weeks):** Docs + config contract + CI skeleton + schema checks.
- **Phase 2 (2–4 weeks):** Walk-forward evaluation + threshold externalization + explainability API.
- **Phase 3 (4–6 weeks):** Portfolio safeguards + observability dashboard + automated reconciliation reporting.
