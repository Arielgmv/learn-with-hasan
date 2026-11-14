"""
Persistence Layer
Handles loading and saving game statistics and high scores securely.
"""

import json
from pathlib import Path
from src.config import HIGH_SCORE_FILE


class HighScoreManager:
    def __init__(self, filepath: Path = HIGH_SCORE_FILE):
        self.filepath = filepath
        self._ensure_dir()

    def _ensure_dir(self) -> None:
        try:
            self.filepath.parent.mkdir(parents=True, exist_ok=True)
        except OSError:
            pass

    def load_high_score(self) -> int:
        if not self.filepath.exists():
            return 0
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                return int(data.get("high_score", 0))
        except (json.JSONDecodeError, OSError, ValueError):
            return 0

    def save_high_score(self, score: int) -> bool:
        current = self.load_high_score()
        if score <= current:
            return False

        try:
            self._ensure_dir()
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump({"high_score": score}, f, indent=2)
            return True
        except OSError:
            return False
