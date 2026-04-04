from bs4 import BeautifulSoup
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class MatchParser:
    def __init__(self, html: str, url: str):
        self.soup = BeautifulSoup(html, 'html.parser')
        self.url = url
        self.data: Dict[str, Any] = {
            "url": url,
            "error_parsing": False
        }

    def _safe_extract(self, finder_func, default=None):
        """Helper to catch missing elements without crashing the scraper."""
        try:
            return finder_func()
        except Exception as e:
            logger.debug(f"Failed to extract field on {self.url}: {str(e)}")
            return default

    def parse(self) -> Dict[str, Any]:
        """
        Executes all extraction methods to build the box-score dictionary.
        Returns the populated dictionary.
        """
        logger.info(f"Parsing DOM for {self.url}")
        
        # High-level Metadata
        self.data["competition"] = self._safe_extract(lambda: self.soup.find('div', class_='page-details').find('h1').text.strip())
        self.data["date"] = self._safe_extract(lambda: self.soup.find('div', class_='details').find('span', class_='timestamp').text.strip())
        
        # Team Names
        self.data["home_team"] = self._safe_extract(lambda: self.soup.find('div', class_='container left').find('h3', class_='thick').text.strip())
        self.data["away_team"] = self._safe_extract(lambda: self.soup.find('div', class_='container right').find('h3', class_='thick').text.strip())
        
        # Score
        score_block = self._safe_extract(lambda: self.soup.find('div', class_='container middle').find('h3', class_='thick scoretime').text.strip())
        self.data["final_score"] = score_block
        if score_block and ' - ' in score_block:
            parts = score_block.split('-')
            self.data["home_score_full"] = parts[0].strip()
            self.data["away_score_full"] = parts[1].strip()

        # Try to pull half-time score
        self.data["half_time_score"] = self._safe_extract(lambda: self.soup.find('dl', class_='header-extra').find('dd').text.strip())

        # Granular Match Stats (if loaded in DOM) - Flattened for ML ingestion
        try:
            stats_tables = self.soup.find_all('table', class_='stats')
            for table in stats_tables:
                rows = table.find_all('tr')
                for row in rows:
                    cols = row.find_all('td')
                    if len(cols) == 3:
                        home_stat = cols[0].text.strip()
                        # Normalize metric name: e.g., "Shots on target" -> "shots_on_target"
                        stat_name = cols[1].text.strip().lower().replace(" ", "_")
                        away_stat = cols[2].text.strip()
                        
                        # Flat keys for simple pandas injection
                        self.data[f"stat_{stat_name}_home"] = home_stat
                        self.data[f"stat_{stat_name}_away"] = away_stat
        except Exception as e:
            logger.debug(f"Could not parse stats table: {e}")

        # Fallback Check
        if not self.data.get("home_team"):
            logger.warning(f"Failed to identify teams on {self.url}. Page structure might have changed.")
            self.data["error_parsing"] = True

        return self.data
