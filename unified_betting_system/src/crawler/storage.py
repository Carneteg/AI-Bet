import json
import os
from typing import Dict, Any

class JSONLinesStorage:
    def __init__(self, output_file: str):
        self.output_file = output_file
        os.makedirs(os.path.dirname(os.path.abspath(self.output_file)), exist_ok=True)

    def append(self, single_record: Dict[str, Any]):
        """Robustly appends a single record in JSONL format."""
        with open(self.output_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(single_record, ensure_ascii=False) + '\n')
