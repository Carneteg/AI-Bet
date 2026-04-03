# AI-Bet — Claude Code Project Guide

## What this is
AI-driven Stryktips (Swedish football pools) analysis web app. Users upload a photo of a Stryktips coupon or odds board; the app uses GPT-4o vision to extract matches, then scores each match for betting value.

## Tech stack
- **Framework:** Next.js 14 (App Router, `output: "standalone"`)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3 with custom theme tokens (see `tailwind.config.ts`)
- **UI state:** React 18 hooks only — no external state library

## Project structure
```
app/
  page.tsx               # Home/landing
  matches/page.tsx       # Match analysis listing
  upload/page.tsx        # Image upload + AI analysis
  coupon/page.tsx        # Coupon builder
  api/analyze-image/     # POST endpoint — calls GPT-4o vision
  globals.css            # Global styles + Tailwind layers
components/
  MatchCard.tsx          # Match display card (uses static Match type)
  MatchImageUpload.tsx   # Drag-drop upload + AnalyzedMatchResult type
  RecommendationTag.tsx  # Badge component — source of truth for rec display config
  ValueBadge.tsx         # Score badge using getValueLabel/getValueColor
  CouponRow.tsx          # Row in coupon builder
  Navbar.tsx
data/
  matches.ts             # Static match data + Match/Recommendation types
lib/
  recommendations.ts     # calculateRecommendation() — single source of truth
  valueScore.ts          # getValueLabel(), getValueColor()
  datasources/
    soccerway.ts         # Team form data + enrichMatchWithSoccerwayData()
```

## Key types (data/matches.ts)
- `Recommendation` — `"spik" | "gardering" | "skräll" | "normal"` (always lowercase)
- `Match` — static match shape; uses `probabilities` (plural)
- `AnalyzedMatchResult` (MatchImageUpload.tsx) — AI-parsed shape; uses `probability` (singular) and `streckning`

## Conventions
- Recommendation values are **always lowercase** — never PascalCase
- Use `calculateRecommendation()` from `lib/recommendations.ts` for any new recommendation logic
- Use `RecommendationTag` component for displaying recommendations — do not duplicate its color/icon config inline
- Utility function prefix convention: `get*` (e.g. `getTeamForm`, `getValueLabel`)
- No external state management — keep state local to pages/components

## Environment variables
See `.env.example`. Required for the upload feature to work:
```
OPENAI_API_KEY=sk-...
```

## Dev workflow
```bash
npm install
cp .env.example .env.local   # then fill in your key
npm run dev                  # http://localhost:3000
npm run lint
npm run build
```
