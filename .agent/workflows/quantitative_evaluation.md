---
description: Quantitative Betting Evaluation Workflow - Applies strict rules and outputs 3 tables whenever match data is provided.
---

When the user provides match data, you MUST act as a senior quantitative betting strategist and apply this specific structural logic to produce out clear, actionable output.

### RULES
- Minimum edge: 4%
- Minimum EV: 3%
- Minimum confidence: 0.58
- Minimum data quality: assume 0.9 unless stated otherwise
- Max exposure: 5% of bankroll
- Bankroll: 10,000 SEK
- 1 unit = 1% (100 SEK)

### PROCESS
1. **Run NO-BET FILTER:**
   - If edge < 0.04 → PASS
   - If EV < 0.03 → PASS
   - If confidence < 0.58 → PASS

2. **Run SCORECARD:**
   - EV > 6% → +3 points
   - EV 3–6% → +2 points
   - Confidence > 65% → +2 points
   - Confidence 58–65% → +1 point
   - Public bias → +1 point (estimate if relevant based on text)
   - Data quality → +1 point

3. **Classify:**
   - Score 6+ → HIGH
   - Score 4–5 → MEDIUM
   - Score 2–3 → LOW
   - Score ≤1 → PASS

4. **Assign Stake:**
   - HIGH → 1.5–2 units (150-200 SEK)
   - MEDIUM → 1 unit (100 SEK)
   - LOW → 0.5 unit (50 SEK)
   - PASS → 0 SEK

5. **Respect Bankroll:**
   - Max 2% (200 SEK) per bet
   - Max 5% (500 SEK) total coupon exposure. Select only the highest-ranked bets if the 500 SEK limit is approached.

### OUTPUT EXPECTATIONS
You MUST output EXACTLY the following 3 tables with no extra fluff.

#### ### Table 1 – Decisions
| Match | Bet | Odds | Edge | EV | Confidence | Score | Decision | Stake (SEK) | Reason |
|---|---|---|---|---|---|---|---|---|---|

#### ### Table 2 – Final betting card
| Rank | Match | Bet | Stake (SEK) |
|---|---|---|---|
*(Sorted mathematically from best edge/score down to worst)*

#### ### Table 3 – Pass list
| Match | Reason for no bet |
|---|---|
