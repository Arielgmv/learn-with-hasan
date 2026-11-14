# Snake Arcade 🐍 (Modular Edition)

A production-grade, object-oriented, and modular implementation of the classic Snake arcade game built with Python and Pygame.

Designed specifically for **scalability**, **clean separation of concerns**, and **straightforward extensibility** (e.g. adding new power-ups, game modes, AI bots, multiplayer, or custom themes).

---

## 📁 Project Architecture

```text
snake_game_modular/
├── main.py                     # Application entry point & dependency check
├── requirements.txt            # Package dependencies (pygame)
├── README.md                   # Architecture and setup documentation
├── data/
│   └── highscore.json          # Persistent high scores (auto-created)
└── src/
    ├── config.py               # Constants, speeds, grid dimensions, tuning
    ├── theme.py                # Visual styling & RGB palette definitions
    ├── storage.py              # Persistence layer (HighScoreManager)
    ├── game.py                 # Core game engine coordinator & main loop
    ├── entities/               # Game models and world actors
    │   ├── snake.py            # Snake entity, body segments & turn buffering
    │   ├── food.py             # Food & GoldenFood entities with spawn logic
    │   └── particles.py        # Burst particles and floating score texts
    ├── states/                 # State Machine pattern for game flow
    │   ├── base_state.py       # Abstract BaseState interface
    │   ├── start_state.py      # Title & start screen
    │   ├── play_state.py       # Active gameplay & collision rules
    │   ├── pause_state.py      # Pause overlay
    │   └── game_over_state.py  # Game over & score summary
    └── ui/                     # Presentation layer
        └── renderer.py         # Pygame rendering, grid, HUD, overlays
```

---

## 🚀 Quick Start

### 1. Activate your virtual environment
```bash
# If using the existing venv in the project root:
source venv/bin/activate
```

### 2. Install dependencies (if not already installed)
```bash
pip install -r snake_game_modular/requirements.txt
```

### 3. Run the game
```bash
python3 snake_game_modular/main.py
```

---

## 🎮 Controls

| Key | Action |
| :--- | :--- |
| <kbd>W</kbd> / <kbd>↑</kbd> | Move Up |
| <kbd>S</kbd> / <kbd>↓</kbd> | Move Down |
| <kbd>A</kbd> / <kbd>←</kbd> | Move Left |
| <kbd>D</kbd> / <kbd>→</kbd> | Move Right |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | Start Game (from menu) |
| <kbd>P</kbd> / <kbd>Space</kbd> | Pause / Resume |
| <kbd>R</kbd> | Restart (from Game Over or during play) |
| <kbd>Q</kbd> / <kbd>Esc</kbd> | Quit |

---

## 🧩 Architectural Highlights

### 1. State Pattern (`src/states/`)
Screens are decoupled into individual self-contained state classes (`StartState`, `PlayState`, `PauseState`, `GameOverState`). Adding a new screen (such as a **SettingsState**, **LevelSelectState**, or **LeaderboardState**) requires only inheriting from `BaseState` and registering it in the state machine without modifying game entity logic.

### 2. Decoupled Entities (`src/entities/`)
- `Snake`: Manages body vectors, growth, boundary checking, and input queue buffering to avoid instant 180° self-collisions.
- `Food` & `GoldenFood`: Encapsulates values, timers, and expiration logic. Easy to subclass for new items (e.g. speed boosts, shields, freeze apples).
- `ParticleSystem`: Independent visual effect engine for bursts and floating `+10` / `+35 BONUS!` score tags.

### 3. Centralized Configuration & Theming
- `src/config.py`: Modify grid cell sizes, speeds, scaling factors, and point values in one place.
- `src/theme.py`: Customize colors and visual appearance without touching game math or loop logic.

### 4. Isolated Persistence (`src/storage.py`)
`HighScoreManager` safely handles reading, writing, and creating directory paths for JSON storage with automatic fallback on corrupted files.
