import urllib.robotparser
import urllib.parse
from bs4 import BeautifulSoup
import logging
from typing import List, Set

logger = logging.getLogger(__name__)

class Discoverer:
    def __init__(self, fetcher):
        self.fetcher = fetcher
        self.rp = urllib.robotparser.RobotFileParser()
        self.robots_loaded_for = set()

    def check_robots_txt(self, url: str) -> bool:
        """
        Ensures compliance with robots.txt for the given domain.
        Caches the rules per domain.
        """
        parsed_url = urllib.parse.urlparse(url)
        domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        if domain not in self.robots_loaded_for:
            robots_url = f"{domain}/robots.txt"
            logger.info(f"Loading robots.txt from {robots_url}")
            self.rp.set_url(robots_url)
            try:
                self.rp.read()
                self.robots_loaded_for.add(domain)
            except Exception as e:
                logger.error(f"Failed to read robots.txt at {robots_url}: {str(e)}")
                # If we can't read it, assume default deny to be safe
                return False
                
        user_agent = self.fetcher.session.headers.get("User-Agent", "*")
        is_allowed = self.rp.can_fetch(user_agent, url)
        
        if not is_allowed:
            logger.warning(f"Robots.txt explicitly BLOCKED scraping for URL: {url}")
            
        return is_allowed

    def extract_match_urls(self, seed_url: str, html: str) -> List[str]:
        """
        Takes a seed URL (like a competition schedule page), parses the HTML, 
        and extracts all URLs that look like individual match pages.
        """
        soup = BeautifulSoup(html, 'html.parser')
        match_urls: Set[str] = set()
        
        # Parse base url to reconstruct absolute links
        parsed_seed = urllib.parse.urlparse(seed_url)
        domain = f"{parsed_seed.scheme}://{parsed_seed.netloc}"

        # Soccerway match URLs typically follow this pattern in the hrefs:
        # /matches/YYYY/MM/DD/country/league/team1/team2/ID/
        
        links = soup.find_all('a', href=True)
        for link in links:
            href = link['href']
            
            # Simple heuristic to identify match pages vs other links
            if '/matches/' in href and href.count('/') >= 7:
                # Resolve relative URLs
                if href.startswith('/'):
                    absolute_url = f"{domain}{href}"
                elif not href.startswith('http'):
                    absolute_url = urllib.parse.urljoin(seed_url, href)
                else:
                    absolute_url = href
                    
                match_urls.add(absolute_url)
                
        logger.info(f"Discovered {len(match_urls)} potential match URLs from seed.")
        return list(match_urls)
