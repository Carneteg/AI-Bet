import pandas as pd
from src.utils import setup_logger

logger = setup_logger(__name__)

def load_jsonl(file_path: str) -> pd.DataFrame:
    logger.info(f"Loading data from {file_path}")
    try:
        df = pd.read_json(file_path, lines=True)
        return df
    except Exception as e:
        logger.error(f"Failed to load JSONL data: {e}")
        return pd.DataFrame()
