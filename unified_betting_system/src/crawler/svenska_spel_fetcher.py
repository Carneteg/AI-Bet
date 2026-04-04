import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
import os
from src.utils.logger import setup_logger

logger = setup_logger(__name__)

class SvenskaSpelFetcher:
    def __init__(self, api_key: Optional[str] = None):
        # API URL
        self.api_base_url = "https://api.svenskaspel.se/drawmanager/v1/draws"
        # HTML URL for scraping subdomain
        self.html_base_url = "https://spela.svenskaspel.se"
        
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
        }

    def fetch_pool(self, product: str) -> List[Dict[str, Any]]:
        """
        Attempts to fetch match data from Svenska Spel.
        """
        product = product.lower()
        return self._fetch_from_html(product)

    def _fetch_from_html(self, product: str) -> List[Dict[str, Any]]:
        url = f"{self.html_base_url}/{product}/"
        logger.info(f"Scraping {product} data from {url}...")
        
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Use confirmed selectors from research
            row_selector = f'.coupon-row.coupon-row-{product}'
            rows = soup.select(row_selector)
            
            if not rows:
                logger.warning(f"No match rows found for {product} using selector {row_selector}")
                return []
                
            matches = []
            for i, row in enumerate(rows):
                try:
                    # Teams
                    teams_div = row.select_one('.coupon-row-teams')
                    if not teams_div: continue
                    team_names = [s.text.strip() for s in teams_div.select('span') if s.text.strip()]
                    if len(team_names) < 2: continue
                    
                    home_team, away_team = team_names[0], team_names[1]
                    
                    # Streck (%) - Search for table row with "Svenska folket"
                    streck = [33, 33, 33]
                    folk_header = row.find('th', string=lambda s: s and "folket" in s.lower())
                    if folk_header:
                        tr = folk_header.find_parent('tr')
                        if tr:
                            vals = [td.text.replace('%','').strip() for td in tr.select('td')]
                            if len(vals) >= 3:
                                streck = [float(v) for v in vals[:3]]
                    
                    # Odds - Search for table row with "Odds"
                    odds = [2.0, 3.0, 3.0]
                    odds_header = row.find('th', string=lambda s: s and "odds" in s.lower())
                    if odds_header:
                        tr = odds_header.find_parent('tr')
                        if tr:
                            vals = [td.text.replace(',','.').strip() for td in tr.select('td')]
                            if len(vals) >= 3:
                                odds = [float(v) for v in vals[:3]]
                    
                    matches.append({
                        "Match": f"{home_team} - {away_team}",
                        "Home Streck": streck[0],
                        "Draw Streck": streck[1],
                        "Away Streck": streck[2],
                        "Home Odds": odds[0],
                        "Draw Odds": odds[1],
                        "Away Odds": odds[2],
                        "Match Number": i + 1
                    })
                except Exception as e:
                    logger.debug(f"Row {i} parse error: {e}")
                    continue
                    
            logger.info(f"Successfully scraped {len(matches)} matches.")
            return matches
            
        except Exception as e:
            logger.error(f"Scraping failed for {product}: {e}")
            return []
