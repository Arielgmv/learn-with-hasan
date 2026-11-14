#!/usr/bin/env python3
"""
Snake Game (Modular Edition) - Application Entry Point
"""

import sys
from pathlib import Path

# Ensure root package directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    import pygame
except ImportError:
    print("\n" + "=" * 60)
    print(" Pygame is required to run the Modular Snake Game.")
    print("=" * 60)
    print("To install Pygame in your virtual environment:")
    print("  source venv/bin/activate")
    print("  pip install -r snake_game_modular/requirements.txt")
    print("\nThen launch:")
    print("  python3 snake_game_modular/main.py")
    print("=" * 60 + "\n")
    sys.exit(1)

from src.game import Game


def main():
    game = Game()
    game.run()


if __name__ == "__main__":
    main()
