import argparse
from src.utils import setup_logger
from src.crawler.fetcher import SoccerwayFetcher
from src.crawler.parser import SoccerwayParser
from src.crawler.discover import MatchDiscoverer
from src.crawler.storage import JSONLinesStorage

logger = setup_logger("CRAWLER")

def main():
    parser = argparse.ArgumentParser(description="Soccerway Manual Match Crawler")
    parser.add_argument("--seed-url", type=str, required=True, help="Base URL to start crawling")
    parser.add_argument("--max-matches", type=int, default=50, help="Maximum matches to scrape")
    parser.add_argument("--output", type=str, default="data/raw_matches.jsonl", help="JSONL output path")
    
    args = parser.parse_args()

    fetcher = SoccerwayFetcher()
    discoverer = MatchDiscoverer("https://int.soccerway.com")
    storage = JSONLinesStorage(args.output)
    
    logger.info(f"Targeting Seed: {args.seed_url}")
    html = fetcher.fetch(args.seed_url)
    if not html:
        logger.error("Failed to fetch seed URL.")
        return
        
    urls_to_scrape = discoverer.discover_match_urls(html, args.seed_url)
    logger.info(f"Discovered {len(urls_to_scrape)} potential match URLs.")
    
    scraped_count = 0
    for url in urls_to_scrape:
        if scraped_count >= args.max_matches:
            break
            
        logger.info(f"Crawling Match: {url}")
        match_html = fetcher.fetch(url)
        if match_html:
            parser = SoccerwayParser(match_html, url)
            match_data = parser.parse()
            
            if "home_team" in match_data:
                storage.append(match_data)
                scraped_count += 1
                
    logger.info(f"Crawling Complete. Captured {scraped_count} matches.")

if __name__ == "__main__":
    main()
