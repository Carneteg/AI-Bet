import os
import json
import joblib
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ModelRegistry:
    def __init__(self, models_dir="models"):
        self.models_dir = models_dir
        os.makedirs(self.models_dir, exist_ok=True)
        self.metadata_path = os.path.join(self.models_dir, "metadata.json")
        self._load_metadata()

    def _load_metadata(self):
        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, 'r') as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {'champion': None, 'history': []}

    def _save_metadata(self):
        with open(self.metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=4)

    def save_model(self, model, metrics: dict, is_champion: bool = False) -> str:
        """Saves a model and registers it."""
        version = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"model_v{version}.joblib"
        filepath = os.path.join(self.models_dir, filename)
        
        joblib.dump(model, filepath)
        
        record = {
            'version': version,
            'filename': filename,
            'trained_at': datetime.now().isoformat(),
            'metrics': metrics,
            'status': 'champion' if is_champion else 'archived' # Challenger will be archived if it loses
        }
        
        self.metadata['history'].append(record)
        
        if is_champion:
            self.metadata['champion'] = record
            # Make a convenience symlink-like copy
            champ_path = os.path.join(self.models_dir, "champion.joblib")
            joblib.dump(model, champ_path)
            logger.info(f"🏆 Model v{version} officially crowned Champion.")
            
        self._save_metadata()
        return version

    def load_champion(self):
        """Loads default active model."""
        champ_path = os.path.join(self.models_dir, "champion.joblib")
        if os.path.exists(champ_path):
            return joblib.load(champ_path)
        logger.warning("No Champion model found in registry.")
        return None
