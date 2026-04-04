import json
import logging
import os
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class Storage:
    def __init__(self, output_file: str):
        self.output_file = output_file
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)

    def save_to_jsonl(self, data: List[Dict[str, Any]]):
        """
        Dumps a list of parsed match dictionaries into a JSON Lines format (one object per line).
        """
        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                for record in data:
                    f.write(json.dumps(record, ensure_ascii=False) + '\n')
            logger.info(f"Successfully saved {len(data)} records to {self.output_file}")
        except Exception as e:
            logger.error(f"Failed to write to {self.output_file}: {str(e)}")

    def append_to_json(self, single_record: Dict[str, Any]):
        """
        Robustly appends a single record to the file in JSONL format.
        This ensures data isn't lost if the script is interrupted, and runs infinitely faster than re-writing large JSON arrays.
        """
        try:
            with open(self.output_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(single_record, ensure_ascii=False) + '\n')
        except Exception as e:
            logger.error(f"Failed to append to {self.output_file}: {str(e)}")
