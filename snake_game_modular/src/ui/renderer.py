"""
Arcade Renderer and Visual Presenter
Encapsulates all drawing routines and font rendering.
"""

import math
from typing import Optional
import pygame

from src.config import (
    GRID_CELL_SIZE,
    GRID_WIDTH,
    GRID_HEIGHT,
    HUD_HEIGHT,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
)
from src.entities.food import Food, GoldenFood
from src.entities.snake import Snake, Direction
from src.theme import (
    COLOR_BG,
    COLOR_GRID,
    COLOR_HUD_BG,
    COLOR_SNAKE_HEAD,
    COLOR_SNAKE_BODY,
    COLOR_SNAKE_EYE,
    COLOR_SNAKE_PUPIL,
    COLOR_FOOD,
    COLOR_FOOD_GLOW,
    COLOR_GOLDEN,
    COLOR_GOLDEN_GLOW,
    COLOR_TEXT_PRIMARY,
    COLOR_TEXT_DIM,
    COLOR_TEXT_ACCENT,
    COLOR_GAME_OVER,
)


class Renderer:
    def __init__(self, screen: pygame.Surface):
        self.screen = screen

        # Initialize fonts with fallback
        self.font_title = pygame.font.SysFont("sans-serif", 46, bold=True)
        self.font_subtitle = pygame.font.SysFont("sans-serif", 28, bold=True)
        self.font_body = pygame.font.SysFont("sans-serif", 18)
        self.font_small = pygame.font.SysFont("sans-serif", 14)

    def clear(self) -> None:
        self.screen.fill(COLOR_BG)

    def draw_grid(self) -> None:
        for x in range(0, SCREEN_WIDTH, GRID_CELL_SIZE):
            pygame.draw.line(self.screen, COLOR_GRID, (x, HUD_HEIGHT), (x, SCREEN_HEIGHT))
        for y in range(HUD_HEIGHT, SCREEN_HEIGHT, GRID_CELL_SIZE):
            pygame.draw.line(self.screen, COLOR_GRID, (0, y), (SCREEN_WIDTH, y))

    def draw_hud(self, score: int, high_score: int, level: int = 1) -> None:
        # Background bar
        hud_rect = pygame.Rect(0, 0, SCREEN_WIDTH, HUD_HEIGHT)
        pygame.draw.rect(self.screen, COLOR_HUD_BG, hud_rect)
        pygame.draw.line(self.screen, COLOR_GRID, (0, HUD_HEIGHT), (SCREEN_WIDTH, HUD_HEIGHT), 2)

        # Score text
        score_surf = self.font_subtitle.render(f"SCORE: {score}", True, COLOR_TEXT_PRIMARY)
        self.screen.blit(score_surf, (20, 16))

        # Best / High score
        best_surf = self.font_subtitle.render(
            f"BEST: {max(score, high_score)}", True, COLOR_TEXT_ACCENT
        )
        self.screen.blit(best_surf, (SCREEN_WIDTH // 2 - best_surf.get_width() // 2, 16))

        # Control quick-hint
        hint_surf = self.font_body.render("P: Pause  |  R: Restart", True, COLOR_TEXT_DIM)
        self.screen.blit(hint_surf, (SCREEN_WIDTH - hint_surf.get_width() - 20, 22))

    def draw_snake(self, snake: Snake) -> None:
        # Body segments with gradient
        for i, (bx, by) in enumerate(snake.body[1:]):
            rect = pygame.Rect(
                bx * GRID_CELL_SIZE + 2,
                by * GRID_CELL_SIZE + HUD_HEIGHT + 2,
                GRID_CELL_SIZE - 4,
                GRID_CELL_SIZE - 4,
            )
            fade = max(0.55, 1.0 - (i / max(1, snake.length * 1.4)))
            color = (
                int(COLOR_SNAKE_BODY[0] * fade),
                int(COLOR_SNAKE_BODY[1] * fade),
                int(COLOR_SNAKE_BODY[2] * fade),
            )
            pygame.draw.rect(self.screen, color, rect, border_radius=6)

        # Head segment
        hx, hy = snake.head
        head_rect = pygame.Rect(
            hx * GRID_CELL_SIZE + 1,
            hy * GRID_CELL_SIZE + HUD_HEIGHT + 1,
            GRID_CELL_SIZE - 2,
            GRID_CELL_SIZE - 2,
        )
        pygame.draw.rect(self.screen, COLOR_SNAKE_HEAD, head_rect, border_radius=8)

        # Eyes facing direction of travel
        dx, dy = snake.direction.value
        center_x = hx * GRID_CELL_SIZE + GRID_CELL_SIZE // 2
        center_y = hy * GRID_CELL_SIZE + HUD_HEIGHT + GRID_CELL_SIZE // 2

        if dx != 0:
            eye1 = (center_x + dx * 4, center_y - 5)
            eye2 = (center_x + dx * 4, center_y + 5)
        else:
            eye1 = (center_x - 5, center_y + dy * 4)
            eye2 = (center_x + 5, center_y + dy * 4)

        for eye in (eye1, eye2):
            pygame.draw.circle(self.screen, COLOR_SNAKE_EYE, eye, 3)
            pygame.draw.circle(self.screen, COLOR_SNAKE_PUPIL, (eye[0] + dx, eye[1] + dy), 1)

    def draw_food(self, food: Food, now_ms: int) -> None:
        fx, fy = food.position
        pulse = (math.sin(now_ms * 0.008) + 1.0) / 2.0  # 0.0 to 1.0
        center_x = fx * GRID_CELL_SIZE + GRID_CELL_SIZE // 2
        center_y = fy * GRID_CELL_SIZE + HUD_HEIGHT + GRID_CELL_SIZE // 2
        radius = int(GRID_CELL_SIZE * 0.38 + pulse * 2.5)

        pygame.draw.circle(self.screen, COLOR_FOOD_GLOW, (center_x, center_y), radius + 2)
        pygame.draw.circle(self.screen, COLOR_FOOD, (center_x, center_y), radius)

    def draw_golden_food(self, golden_food: Optional[GoldenFood], now_ms: int) -> None:
        if not golden_food or golden_food.is_expired:
            return

        gx, gy = golden_food.position
        pulse = (math.cos(now_ms * 0.012) + 1.0) / 2.0
        center_x = gx * GRID_CELL_SIZE + GRID_CELL_SIZE // 2
        center_y = gy * GRID_CELL_SIZE + HUD_HEIGHT + GRID_CELL_SIZE // 2
        radius = int(GRID_CELL_SIZE * 0.44 + pulse * 3)

        pygame.draw.circle(self.screen, COLOR_GOLDEN_GLOW, (center_x, center_y), radius + 3)
        pygame.draw.circle(self.screen, COLOR_GOLDEN, (center_x, center_y), radius)

    def draw_pause_overlay(self) -> None:
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((10, 14, 22, 190))
        self.screen.blit(overlay, (0, 0))

        title = self.font_title.render("PAUSED", True, COLOR_TEXT_ACCENT)
        hint = self.font_body.render("Press SPACE or P to Resume", True, COLOR_TEXT_PRIMARY)

        self.screen.blit(title, (SCREEN_WIDTH // 2 - title.get_width() // 2, SCREEN_HEIGHT // 2 - 40))
        self.screen.blit(hint, (SCREEN_WIDTH // 2 - hint.get_width() // 2, SCREEN_HEIGHT // 2 + 20))

    def draw_game_over_overlay(self, final_score: int, high_score: int, is_new_record: bool) -> None:
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((10, 14, 22, 215))
        self.screen.blit(overlay, (0, 0))

        over_surf = self.font_title.render("GAME OVER", True, COLOR_GAME_OVER)
        self.screen.blit(over_surf, (SCREEN_WIDTH // 2 - over_surf.get_width() // 2, SCREEN_HEIGHT // 2 - 75))

        score_surf = self.font_subtitle.render(f"Final Score: {final_score}", True, COLOR_TEXT_PRIMARY)
        self.screen.blit(score_surf, (SCREEN_WIDTH // 2 - score_surf.get_width() // 2, SCREEN_HEIGHT // 2 - 18))

        if is_new_record:
            rec_surf = self.font_body.render("★ NEW HIGH SCORE! ★", True, COLOR_TEXT_ACCENT)
            self.screen.blit(rec_surf, (SCREEN_WIDTH // 2 - rec_surf.get_width() // 2, SCREEN_HEIGHT // 2 + 20))
        else:
            best_surf = self.font_body.render(f"High Score: {high_score}", True, COLOR_TEXT_DIM)
            self.screen.blit(best_surf, (SCREEN_WIDTH // 2 - best_surf.get_width() // 2, SCREEN_HEIGHT // 2 + 20))

        hint_surf = self.font_body.render("Press [R] to Play Again   •   [Q] to Quit", True, COLOR_TEXT_PRIMARY)
        self.screen.blit(hint_surf, (SCREEN_WIDTH // 2 - hint_surf.get_width() // 2, SCREEN_HEIGHT // 2 + 65))

    def draw_start_screen(self, high_score: int) -> None:
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((10, 14, 22, 220))
        self.screen.blit(overlay, (0, 0))

        title = self.font_title.render("SNAKE ARCADE 🐍", True, COLOR_SNAKE_HEAD)
        self.screen.blit(title, (SCREEN_WIDTH // 2 - title.get_width() // 2, SCREEN_HEIGHT // 2 - 80))

        subtitle = self.font_subtitle.render("Press SPACE or ENTER to Play", True, COLOR_TEXT_PRIMARY)
        self.screen.blit(subtitle, (SCREEN_WIDTH // 2 - subtitle.get_width() // 2, SCREEN_HEIGHT // 2 - 15))

        controls = self.font_body.render("Controls: WASD or Arrow Keys", True, COLOR_TEXT_DIM)
        self.screen.blit(controls, (SCREEN_WIDTH // 2 - controls.get_width() // 2, SCREEN_HEIGHT // 2 + 35))

        best = self.font_body.render(f"Current High Score: {high_score}", True, COLOR_TEXT_ACCENT)
        self.screen.blit(best, (SCREEN_WIDTH // 2 - best.get_width() // 2, SCREEN_HEIGHT // 2 + 75))
