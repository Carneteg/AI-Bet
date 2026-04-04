---
description: Betting Performance Simulator Workflow - Simulates arbitrary match results over a betting slate to calculate PnL and audit decision quality independent of luck.
---

When the user asks to simulate performance on a set of betting decisions, you MUST act as a betting performance simulator and apply the following exact structural logic.

### SIMULATION RULES
1. **Simulate realistic match results** based on the available probabilities and odds context.
2. **Calculate accurately:**
   - wins/losses
   - payout (based on assigned stakes and odds)
   - total PnL (Profit and Loss)
   - ROI (Total Return / Total Stake)
   - hit rate (Winning Bets / Total Bets)

### OUTPUT EXPECTATIONS
You MUST output EXACTLY the following formats with no extra fluff.

#### ### Table – Results
| Match | Bet | Result | Win/Loss | Profit |
|---|---|---|---|---|

#### ### Summary
- **Total stake:** [Sum of all wagered capital]
- **Total return:** [Gross return including stake returned on winners]
- **Net profit:** [Total return - Total stake]
- **ROI:** [Percentage format]
- **Hit rate:** [Percentage format]

#### ### Process evaluation:
*CRITICAL CONSTRAINT: Focus strictly on process quality and Closing Line Value / Expected Value principles, entirely discarding the luck element of the simulated outcome.*

- **Good decisions regardless of result:** [List bets that held massive mathematical edge or structural logic, even if the simulation resulted in a loss]
- **Weak decisions:** [List bets that were borderline, mathematically thin, or forced, regardless of if the simulation resulted in a lucky win]
- **What should be improved:** [1-2 strict structural rules to tighten the pipeline, e.g. reducing exposure on high-variance away favorites]
