import requests
import time
import logging
from fake_useragent import UserAgent
from src.utils import setup_logger

logger = setup_logger(__name__)

class SoccerwayFetcher:
    def __init__(self, delay_min: float = 2.0, delay_max: float = 5.0):
        self.session = requests.Session()
        self.ua = UserAgent()
        self.delay_min = delay_min
        self.delay_max = delay_max

    def fetch(self, url: str) -> str:
        headers = {"User-Agent": self.ua.random}
        
        try:
            import random
            time.sleep(random.uniform(self.delay_min, self.delay_max))
            
            response = self.session.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            if "robots.txt" in url:
                return response.text
                
            return response.text
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return ""
