import requests
import time
import random
import logging
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

class RobustFetcher:
    def __init__(self, delay_min: float = 2.0, delay_max: float = 5.0, max_retries: int = 3):
        self.session = requests.Session()
        self.ua = UserAgent()
        self.delay_min = delay_min
        self.delay_max = delay_max
        self.max_retries = max_retries
        
        # Initial headers
        self.session.headers.update({
            "User-Agent": self.ua.random,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        })

    def _sleep(self):
        """Implements a polite, randomized delay between requests"""
        delay = random.uniform(self.delay_min, self.delay_max)
        logger.debug(f"Sleeping for {delay:.2f} seconds...")
        time.sleep(delay)

    def _rotate_user_agent(self):
        """Rotate user agent to avoid basic fingerprinting"""
        new_ua = self.ua.random
        self.session.headers.update({"User-Agent": new_ua})
        logger.debug(f"Rotated User-Agent: {new_ua}")

    def fetch(self, url: str) -> str:
        """
        Fetches the HTML content of the URL with robust retry logic.
        Returns the HTML string, or None if completely failed.
        """
        self._sleep()
        
        for attempt in range(1, self.max_retries + 1):
            try:
                # Rotate UA on retries
                if attempt > 1:
                    self._rotate_user_agent()
                    
                logger.info(f"Fetching URL: {url} (Attempt {attempt}/{self.max_retries})")
                response = self.session.get(url, timeout=15)
                
                # Check for rate limiting explicitly
                if response.status_code == 429:
                    logger.warning("HTTP 429 Too Many Requests. Enforcing massive backoff.")
                    time.sleep(15 * attempt)
                    continue
                    
                # Raise exception for 4xx and 5xx
                response.raise_for_status()
                
                return response.text

            except requests.exceptions.RequestException as e:
                logger.error(f"Network error on {url}: {str(e)}")
                if attempt == self.max_retries:
                    logger.error(f"Failed to fetch {url} after {self.max_retries} attempts.")
                    return None
                    
                # Exponential backoff
                backoff = attempt * 3
                logger.info(f"Backing off for {backoff} seconds before retry.")
                time.sleep(backoff)
                
        return None
