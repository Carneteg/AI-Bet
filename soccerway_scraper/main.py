import argparse
import logging
import sys
import os

# Add core to path just in case
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.fetcher import RobustFetcher
from core.discovery import Discoverer
from core.parser import MatchParser
from core.storage import Storage

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(module)s: %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

def main():
    parser = argparse.ArgumentParser(description="Manual Soccerway Football Data Scraper for AI Pipeline")
    parser.add_argument("--seed-url", type=str, help="The URL to start crawling from (either a competition schedule page or a single match).")
    parser.add_argument("--input-file", type=str, help="Path to a text file containing one URL per line.")
    parser.add_argument("--max-matches", type=int, default=10, help="Maximum number of matches to scrape during this manual run.")
    parser.add_argument("--output-file", type=str, default="data/output.jsonl", help="Path to save the resulting JSON Lines data.")
    parser.add_argument("--delay-min", type=float, default=2.0, help="Minimum sleep delay between HTTP requests.")
    parser.add_argument("--delay-max", type=float, default=5.0, help="Maximum sleep delay between HTTP requests.")
    args = parser.parse_args()

    setup_logging()
    logger = logging.getLogger("MAIN")

    if not args.seed_url and not args.input_file:
        logger.error("You must provide either --seed-url or --input-file")
        sys.exit(1)

    logger.info("Initializing Scraper Architecture...")
    fetcher = RobustFetcher(delay_min=args.delay_min, delay_max=args.delay_max)
    discoverer = Discoverer(fetcher)
    storage = Storage(output_file=args.output_file)

    match_urls_to_scrape = set()

    # Determine targets
    if args.input_file:
        try:
            with open(args.input_file, 'r') as f:
                urls = [line.strip() for line in f if line.strip()]
                match_urls_to_scrape.update(urls)
        except Exception as e:
            logger.error(f"Failed to read input file: {e}")
            sys.exit(1)

    # Discover from seed
    if args.seed_url:
        if "/matches/" in args.seed_url and args.seed_url.count("/") >= 7:
            # Looks like a direct match URL
            match_urls_to_scrape.add(args.seed_url)
        else:
            # Treat as a league/competition page to discover from
            logger.info(f"Checking robots.txt for {args.seed_url}")
            if not discoverer.check_robots_txt(args.seed_url):
                logger.error("Execution aborted: robots.txt forbids crawling this seed.")
                sys.exit(1)

            html = fetcher.fetch(args.seed_url)
            if html:
                discovered = discoverer.extract_match_urls(args.seed_url, html)
                match_urls_to_scrape.update(discovered)

    targets = list(match_urls_to_scrape)[:args.max_matches]
    logger.info(f"Targeting {len(targets)} match URLs strictly for this manual execution.")

    # Execution Loop
    for idx, url in enumerate(targets):
        logger.info(f"--- Processing [{idx+1}/{len(targets)}] ---")
        
        # Obey robots before hitting match pages
        if not discoverer.check_robots_txt(url):
            logger.warning(f"Skipping {url} due to robots.txt restrictions.")
            continue
            
        html = fetcher.fetch(url)
        if not html:
            continue
            
        parser_engine = MatchParser(html, url)
        match_data = parser_engine.parse()
        
        # Immediately write to disk to prevent data loss on manual interrupt
        storage.append_to_json(match_data)
        
    logger.info(f"Scraping completed. Extracted data saved to {args.output_file}")

if __name__ == "__main__":
    main()
