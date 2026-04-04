import requests
import time
import logging
import random
from src.utils import setup_logger

logger = setup_logger(__name__)

class SoccerwayFetcher:
    def __init__(self, delay_min: float = 2.0, delay_max: float = 5.0):
        self.session = requests.Session()
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ]
        self.delay_min = delay_min
        self.delay_max = delay_max

    def fetch(self, url: str) -> str:
        headers = {"User-Agent": random.choice(self.user_agents)}
        
        try:
            time.sleep(random.uniform(self.delay_min, self.delay_max))
            
            response = self.session.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            return response.text
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return ""
