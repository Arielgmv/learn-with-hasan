# Day 3: Snake Game in Python 🐍

Two complete editions of the classic Snake game:
1. **Terminal Edition (`snake.py`)**: Runs instantly in your terminal using Python's built-in `curses` library with **zero external dependencies**.
2. **Arcade GUI Edition (`snake_gui.py`)**: A modern graphical arcade experience built with `pygame` featuring animations, particle effects, and glowing fruit.

---

## 🕹️ Option 1: Terminal Edition (Instant Play, 0 Dependencies)

Run directly from any standard Linux/macOS terminal:

```bash
python3 day_3/snake.py
```

### Controls
| Key | Action |
| :--- | :--- |
| <kbd>W</kbd> / <kbd>↑</kbd> | Move Up |
| <kbd>S</kbd> / <kbd>↓</kbd> | Move Down |
| <kbd>A</kbd> / <kbd>←</kbd> | Move Left |
| <kbd>D</kbd> / <kbd>→</kbd> | Move Right |
| <kbd>P</kbd> or <kbd>Space</kbd> | Pause / Resume |
| <kbd>R</kbd> | Restart (on Game Over) |
| <kbd>Q</kbd> / <kbd>Esc</kbd> | Quit |

---

## 🎮 Option 2: Arcade GUI Edition (Pygame)

For full graphical rendering, particle bursts, and animations:

### 1. Setup Virtual Environment & Install Pygame
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r day_3/requirements.txt
```

### 2. Run the Game
```bash
python3 day_3/snake_gui.py
```

---

## ✨ Features Included
- **Persistent High Scores**: Automatically saved to `highscore.json`.
- **Golden Bonus Fruit**: Special timed golden apples (+35 bonus points) spawn occasionally.
- **Progressive Difficulty**: Movement speeds up dynamically as the snake grows longer.
- **Collision Protection**: Instant 180-degree self-reversals are blocked to avoid accidental deaths.
- **Pause & Instant Restart**: Seamless flow with <kbd>Space</kbd>/<kbd>P</kbd> and <kbd>R</kbd>.
