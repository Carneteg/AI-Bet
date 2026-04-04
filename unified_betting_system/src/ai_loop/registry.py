import os
import json
import joblib
from datetime import datetime
from src.utils import setup_logger

logger = setup_logger(__name__)

class ModelRegistry:
    def __init__(self, models_dir="models"):
        self.models_dir = models_dir
        os.makedirs(self.models_dir, exist_ok=True)
        self.meta_path = os.path.join(self.models_dir, "metadata.json")
        self._load()

    def _load(self):
        if os.path.exists(self.meta_path):
            with open(self.meta_path, 'r') as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {'champion': None, 'history': []}

    def _save(self):
        with open(self.meta_path, 'w') as f:
            json.dump(self.metadata, f, indent=4)

    def register(self, model, metrics: dict, is_champion: bool) -> str:
        version = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"model_v{version}.joblib"
        out_path = os.path.join(self.models_dir, filename)
        
        joblib.dump(model, out_path)
        record = {
            'version': version,
            'file': filename,
            'metrics': metrics,
            'status': 'champion' if is_champion else 'archived'
        }
        
        self.metadata['history'].append(record)
        if is_champion:
            self.metadata['champion'] = record
            champ_path = os.path.join(self.models_dir, "champion.joblib")
            joblib.dump(model, champ_path)
            logger.info(f"🏆 v{version} officially installed as Champion in registry.")
            
        self._save()
        return version
