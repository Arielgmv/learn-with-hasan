"""
Game Engine and Main Loop Coordinator
Coordinates entities, state machines, input handling, and frame timing.
"""

import sys
from typing import Optional
import pygame

from src.config import (
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    GRID_WIDTH,
    GRID_HEIGHT,
    FPS,
    REGULAR_FOOD_POINTS,
)
from src.storage import HighScoreManager
from src.entities.snake import Snake
from src.entities.food import Food, GoldenFood, spawn_food_position
from src.entities.particles import ParticleSystem
from src.ui.renderer import Renderer
from src.states.base_state import BaseState
from src.states.start_state import StartState
from src.states.play_state import PlayState
from src.states.pause_state import PauseState
from src.states.game_over_state import GameOverState


class Game:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("Snake Arcade 🐍 (Modular Edition)")
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()

        # Core subsystems
        self.storage = HighScoreManager()
        self.high_score = self.storage.load_high_score()
        self.renderer = Renderer(self.screen)
        self.particle_system = ParticleSystem()

        # Game entities
        self.snake = Snake(GRID_WIDTH // 2, GRID_HEIGHT // 2)
        self.golden_food: Optional[GoldenFood] = None
        self.food = Food(self._spawn_initial_food(), points=REGULAR_FOOD_POINTS)
        self.score = 0
        self.is_new_record = False

        # States
        self.start_state = StartState(self)
        self.play_state = PlayState(self)
        self.pause_state = PauseState(self)
        self.game_over_state = GameOverState(self)

        self.current_state: BaseState = self.start_state
        self.is_running = True

    def _spawn_initial_food(self) -> tuple[int, int]:
        occupied = set(self.snake.body)
        return spawn_food_position(GRID_WIDTH, GRID_HEIGHT, occupied)

    def change_state(self, next_state: BaseState) -> None:
        self.current_state.on_exit()
        self.current_state = next_state
        self.current_state.on_enter()

    def start_new_game(self) -> None:
        self.snake.reset(GRID_WIDTH // 2, GRID_HEIGHT // 2)
        self.golden_food = None
        self.food = Food(self._spawn_initial_food(), points=REGULAR_FOOD_POINTS)
        self.score = 0
        self.is_new_record = False
        self.particle_system.clear()
        self.change_state(self.play_state)

    def push_pause(self) -> None:
        self.change_state(self.pause_state)

    def pop_pause(self) -> None:
        self.change_state(self.play_state)

    def trigger_game_over(self) -> None:
        if self.score > self.high_score:
            self.high_score = self.score
            self.storage.save_high_score(self.high_score)
            self.is_new_record = True
        else:
            self.is_new_record = False

        self.change_state(self.game_over_state)

    def quit(self) -> None:
        self.is_running = False

    def handle_events(self) -> None:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.quit()
                return
            self.current_state.handle_event(event)

    def run(self) -> None:
        """Main game loop ticking at designated FPS."""
        while self.is_running:
            self.handle_events()
            self.current_state.update()
            self.current_state.draw()
            pygame.display.flip()
            self.clock.tick(FPS)

        pygame.quit()
        sys.exit(0)
