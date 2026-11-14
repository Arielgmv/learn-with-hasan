"""
Core Gameplay State
"""

import random
import pygame

from src.states.base_state import BaseState
from src.entities.snake import Direction
from src.entities.food import Food, GoldenFood, spawn_food_position
from src.theme import COLOR_FOOD, COLOR_GOLDEN, COLOR_GAME_OVER
from src.config import (
    GRID_WIDTH,
    GRID_HEIGHT,
    INITIAL_STEP_DELAY,
    MIN_STEP_DELAY,
    SPEED_SCALING_FACTOR,
    REGULAR_FOOD_POINTS,
    GOLDEN_FOOD_POINTS,
    GOLDEN_FOOD_SPAWN_CHANCE,
    GOLDEN_FOOD_LIFETIME_TICKS,
)


class PlayState(BaseState):
    def __init__(self, game):
        super().__init__(game)
        self.step_delay = INITIAL_STEP_DELAY
        self.last_move_time = pygame.time.get_ticks()

    def on_enter(self) -> None:
        self.last_move_time = pygame.time.get_ticks()

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type != pygame.KEYDOWN:
            return

        if event.key in (pygame.K_ESCAPE, pygame.K_q):
            self.game.quit()
        elif event.key in (pygame.K_p, pygame.K_SPACE):
            self.game.push_pause()
        elif event.key == pygame.K_r:
            self.game.start_new_game()
        # Direction mappings
        elif event.key in (pygame.K_UP, pygame.K_w):
            self.game.snake.queue_direction(Direction.UP)
        elif event.key in (pygame.K_DOWN, pygame.K_s):
            self.game.snake.queue_direction(Direction.DOWN)
        elif event.key in (pygame.K_LEFT, pygame.K_a):
            self.game.snake.queue_direction(Direction.LEFT)
        elif event.key in (pygame.K_RIGHT, pygame.K_d):
            self.game.snake.queue_direction(Direction.RIGHT)

    def update(self) -> None:
        self.game.particle_system.update()

        current_time = pygame.time.get_ticks()
        if current_time - self.last_move_time < self.step_delay:
            return

        self.last_move_time = current_time

        # Tick golden food countdown
        if self.game.golden_food:
            self.game.golden_food.tick()
            if self.game.golden_food.is_expired:
                self.game.golden_food = None

        # Predict next head
        dx, dy = self.game.snake.next_direction.value
        hx, hy = self.game.snake.head
        next_head = (hx + dx, hy + dy)

        # Check collision with regular or golden food
        ate_regular = (next_head == self.game.food.position)
        ate_golden = (
            self.game.golden_food is not None
            and next_head == self.game.golden_food.position
        )
        should_grow = ate_regular or ate_golden

        # Step the snake
        new_head = self.game.snake.step(grow=should_grow)

        # Boundary collision check
        if self.game.snake.check_boundary_collision(GRID_WIDTH, GRID_HEIGHT):
            self.handle_death()
            return

        # Self collision check
        if self.game.snake.check_self_collision():
            self.handle_death()
            return

        # Handle regular food consumption
        if ate_regular:
            self.game.score += REGULAR_FOOD_POINTS
            self.game.particle_system.spawn_burst(new_head[0], new_head[1], COLOR_FOOD, count=16)
            self.game.particle_system.spawn_floating_text(
                new_head[0],
                new_head[1],
                f"+{REGULAR_FOOD_POINTS}",
                (255, 230, 100),
                self.game.renderer.font_body,
            )

            # Respawn regular food
            self.respawn_regular_food()

            # Dynamic speed adjustment
            self.step_delay = max(
                MIN_STEP_DELAY,
                int(INITIAL_STEP_DELAY - (self.game.snake.length * SPEED_SCALING_FACTOR)),
            )

            # Chance to spawn golden food
            if self.game.golden_food is None and random.random() < GOLDEN_FOOD_SPAWN_CHANCE:
                self.spawn_golden_food()

        # Handle golden food consumption
        elif ate_golden:
            self.game.score += GOLDEN_FOOD_POINTS
            self.game.particle_system.spawn_burst(new_head[0], new_head[1], COLOR_GOLDEN, count=24)
            self.game.particle_system.spawn_floating_text(
                new_head[0],
                new_head[1],
                f"+{GOLDEN_FOOD_POINTS} BONUS!",
                COLOR_GOLDEN,
                self.game.renderer.font_subtitle,
            )
            self.game.golden_food = None

    def respawn_regular_food(self) -> None:
        occupied = set(self.game.snake.body)
        if self.game.golden_food:
            occupied.add(self.game.golden_food.position)
        pos = spawn_food_position(GRID_WIDTH, GRID_HEIGHT, occupied)
        self.game.food = Food(pos, points=REGULAR_FOOD_POINTS)

    def spawn_golden_food(self) -> None:
        occupied = set(self.game.snake.body)
        occupied.add(self.game.food.position)
        pos = spawn_food_position(GRID_WIDTH, GRID_HEIGHT, occupied)
        self.game.golden_food = GoldenFood(
            pos,
            points=GOLDEN_FOOD_POINTS,
            duration_ticks=GOLDEN_FOOD_LIFETIME_TICKS,
        )

    def handle_death(self) -> None:
        hx, hy = self.game.snake.head
        self.game.particle_system.spawn_burst(hx, hy, COLOR_GAME_OVER, count=32)
        self.game.trigger_game_over()

    def draw(self) -> None:
        self.game.renderer.clear()
        self.game.renderer.draw_grid()

        now = pygame.time.get_ticks()
        self.game.renderer.draw_food(self.game.food, now)
        self.game.renderer.draw_golden_food(self.game.golden_food, now)
        self.game.renderer.draw_snake(self.game.snake)
        self.game.particle_system.draw(self.game.renderer.screen)
        self.game.renderer.draw_hud(self.game.score, self.game.high_score)
