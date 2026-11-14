"""
Game Configuration and Constants
Easily tweak dimensions, speeds, scoring, and file paths.
"""

from pathlib import Path

# --- Display & Grid ---
GRID_CELL_SIZE: int = 24
GRID_WIDTH: int = 28
GRID_HEIGHT: int = 24
HUD_HEIGHT: int = 60

SCREEN_WIDTH: int = GRID_WIDTH * GRID_CELL_SIZE
SCREEN_HEIGHT: int = GRID_HEIGHT * GRID_CELL_SIZE + HUD_HEIGHT
FPS: int = 60

# --- Gameplay Speeds (milliseconds per step) ---
INITIAL_STEP_DELAY: int = 110
MIN_STEP_DELAY: int = 50
SPEED_SCALING_FACTOR: float = 1.25  # step delay decrease per snake segment

# --- Scoring ---
REGULAR_FOOD_POINTS: int = 10
GOLDEN_FOOD_POINTS: int = 35
GOLDEN_FOOD_SPAWN_CHANCE: float = 0.25
GOLDEN_FOOD_LIFETIME_TICKS: int = 42

# --- File Paths ---
BASE_DIR: Path = Path(__file__).resolve().parent.parent
DATA_DIR: Path = BASE_DIR / "data"
HIGH_SCORE_FILE: Path = DATA_DIR / "highscore.json"
