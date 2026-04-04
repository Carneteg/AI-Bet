import json
import os
from typing import Dict, Any

class BankrollManager:
    def __init__(self, file_path: str = "data/bankroll.json"):
        self.file_path = file_path
        self.default_bankroll = 10000.0
        self.load_data()

    def load_data(self):
        if os.path.exists(self.file_path):
            with open(self.file_path, 'r') as f:
                self.data = json.load(f)
        else:
            self.data = {
                "current_bankroll": self.default_bankroll,
                "currency": "SEK",
                "last_updated": "2024-04-04T08:34:00Z"
            }
            self.save_data()

    def save_data(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        with open(self.file_path, 'w') as f:
            json.dump(self.data, f, indent=2)

    def get_unit_value(self) -> float:
        # 1 unit = 1% of bankroll
        return self.data["current_bankroll"] * 0.01

    def calculate_stake(self, tier: str) -> float:
        unit = self.get_unit_value()
        mapping = {
            "LOW": 0.5,
            "MEDIUM": 1.0,
            "HIGH": 1.5,
            "VERY_HIGH": 2.0
        }
        return round(unit * mapping.get(tier.upper(), 0.0), 2)

    def update_bankroll(self, pnl: float):
        self.data["current_bankroll"] += pnl
        self.save_data()
