from bs4 import BeautifulSoup
from urllib.parse import urljoin
from typing import List

class MatchDiscoverer:
    def __init__(self, base_url: str):
        self.base_url = base_url

    def discover_match_urls(self, html: str, current_url: str) -> List[str]:
        soup = BeautifulSoup(html, 'html.parser')
        urls = set()
        for a in soup.find_all('a', href=True):
            href = a['href']
            if ('/matches/' in href or '/national/' in href) and '/teams/' not in href:
                urls.add(urljoin(self.base_url, href))
        return list(urls)
