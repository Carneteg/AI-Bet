import logging
import sys

def setup_logger(module_name: str) -> logging.Logger:
    logger = logging.getLogger(module_name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(module)s: %(message)s'))
        logger.addHandler(handler)
    return logger
