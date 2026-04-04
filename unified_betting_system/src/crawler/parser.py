from bs4 import BeautifulSoup
import re
from typing import Dict, Any
from src.utils import setup_logger

logger = setup_logger(__name__)

class SoccerwayParser:
    def __init__(self, html: str, url: str):
        self.soup = BeautifulSoup(html, 'html.parser')
        self.url = url
        self.data: Dict[str, Any] = {"source_url": url}

    def _safe_extract(self, func, default=None):
        try:
            return func()
        except AttributeError:
            return default

    def parse(self) -> Dict[str, Any]:
        match_info = self.soup.find('div', class_='match-info')
        if not match_info:
            return self.data
            
        self.data["date"] = self._safe_extract(lambda: match_info.find('div', class_='details').find('a').text.strip())
        self.data["competition"] = self._safe_extract(lambda: self.soup.find('div', class_='clearfix competition').find('h2').text.strip())
        self.data["home_team"] = self._safe_extract(lambda: self.soup.find('h3', class_='thick home').text.strip())
        self.data["away_team"] = self._safe_extract(lambda: self.soup.find('h3', class_='thick away').text.strip())
        
        # Parse Score
        score = self._safe_extract(lambda: self.soup.find('h3', class_='thick scoretime').text.strip())
        if score and ' - ' in score:
            h, a = score.split(' - ')
            self.data["home_score_full"] = h.strip()
            self.data["away_score_full"] = a.strip()

        # Flat match stats
        try:
            stats_tables = self.soup.find_all('table', class_='stats')
            for table in stats_tables:
                for row in table.find_all('tr'):
                    cols = row.find_all('td')
                    if len(cols) == 3:
                        home_stat = cols[0].text.strip()
                        stat_name = cols[1].text.strip().lower().replace(" ", "_")
                        away_stat = cols[2].text.strip()
                        self.data[f"stat_{stat_name}_home"] = home_stat
                        self.data[f"stat_{stat_name}_away"] = away_stat
        except Exception:
            pass

        return self.data
