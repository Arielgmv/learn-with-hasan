# Snake Arcade 🐍 (Modular Web Edition)

A high-performance, object-oriented modular implementation of the classic Snake arcade game built with vanilla **HTML5 Canvas, CSS, and modern ES6+ JavaScript modules**.

Faithfully translated from the architecture and design of [`snake_game_modular`](../snake_game_modular/), maintaining 1:1 parity in logic, state machines, entity separation, theming, and mechanics.

---

## 📁 Modular Project Structure

```text
snake_game_modular_js/
├── index.html                  # Semantic canvas shell & responsive arcade wrapper
├── style.css                   # Cyber-arcade cabinet theme & virtual controls
├── main.js                     # Web entry point & gamepad/touch listener binding
├── README.md                   # Documentation & extension reference
└── src/
    ├── config.js               # Grid sizes, delays, speeds, and scoring constants
    ├── theme.js                # Color definitions and visual styling palette
    ├── storage.js              # Persistence layer (LocalStorage with memory fallback)
    ├── game.js                 # Core engine coordinator and requestAnimationFrame loop
    ├── entities/               # Game models
    │   ├── index.js            # Barrel exports for entities
    │   ├── snake.js            # Snake entity, body vectors, & turn-buffering
    │   ├── food.js             # Food and GoldenFood entities with spawn routines
    │   └── particles.js        # Burst particles and floating score indicators
    ├── states/                 # State pattern (screen lifecycle)
    │   ├── index.js            # Barrel exports for states
    │   ├── base_state.js       # Abstract BaseState interface
    │   ├── start_state.js      # Title screen with high-score display
    │   ├── play_state.js       # Active game loop, speed scaling, & collisions
    │   ├── pause_state.js      # Semi-transparent pause overlay
    │   └── game_over_state.js  # Game over screen & record announcements
    └── ui/                     # Presentation layer
        ├── index.js            # Barrel exports for UI
        └── renderer.js         # Canvas 2D rendering, grid, HUD, eyes, and overlays
```

---

## 🚀 Running the Game

Because the project uses standard ECMAScript modules (`import`/`export`), it is best served via any lightweight HTTP server.

### Option 1: Python HTTP Server (Built-in)
From the root of the project:

```bash
python3 -m http.server 8000
```
Then open your browser at:
👉 **[http://localhost:8000/snake_game_modular_js/](http://localhost:8000/snake_game_modular_js/)**

### Option 2: Node / npx (if installed)
```bash
npx serve snake_game_modular_js
```

---

## 🎮 Controls

| Action | Keyboard | Touch / On-Screen |
| :--- | :--- | :--- |
| **Move Up** | <kbd>W</kbd> or <kbd>↑</kbd> | ▲ Button |
| **Move Down** | <kbd>S</kbd> or <kbd>↓</kbd> | ▼ Button |
| **Move Left** | <kbd>A</kbd> or <kbd>←</kbd> | ◀ Button |
| **Move Right** | <kbd>D</kbd> or <kbd>→</kbd> | ▶ Button |
| **Start / Resume** | <kbd>Space</kbd> or <kbd>Enter</kbd> | **Play / Resume** button |
| **Pause** | <kbd>P</kbd> or <kbd>Space</kbd> | **Play / Resume** button |
| **Restart** | <kbd>R</kbd> | **Restart (R)** button |

---

## 🧩 Architectural Parity with `snake_game_modular`

1. **State Pattern (`src/states/`)**:
   - Encapsulates each screen (`StartState`, `PlayState`, `PauseState`, `GameOverState`).
   - Clean lifecycle methods: `onEnter()`, `onExit()`, `handleInput(event)`, `update(dt)`, and `draw()`.
   - Adding a new screen (e.g. `SettingsState`, `LeaderboardState`) requires zero changes to the snake or food logic.

2. **Decoupled Game Models (`src/entities/`)**:
   - `Snake`: Manages segment arrays, direction buffering to eliminate accidental 180° self-collisions, and boundary checks.
   - `Food` & `GoldenFood`: Separate objects with their own point values, timers, and expiration logic.
   - `ParticleSystem`: Independent visual effect engine for bursts upon eating and animated `+10` / `+35 BONUS!` floaters.

3. **Pure Presenter (`src/ui/renderer.js`)**:
   - All Canvas 2D drawing routines are isolated from game state calculation.
   - Renders animated eyes facing the direction of movement, body gradient, and glowing pulsing food orbs.

4. **Persistence Layer (`src/storage.js`)**:
   - `HighScoreManager` reads and writes to browser `localStorage` with automatic fallback to in-memory storage if storage is blocked or in private mode.
