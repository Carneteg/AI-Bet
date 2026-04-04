import pandas as pd
import logging

logger = logging.getLogger(__name__)

def load_jsonl(file_path: str) -> pd.DataFrame:
    """
    Loads normalized JSON Lines football data.
    Ensures that empty files or missing fields don't crash the pipeline.
    """
    logger.info(f"Loading data from {file_path}")
    try:
        df = pd.read_json(file_path, lines=True)
        logger.info(f"Loaded {len(df)} initial records.")
        return df
    except Exception as e:
        logger.error(f"Failed to load JSONL data: {e}")
        return pd.DataFrame()
