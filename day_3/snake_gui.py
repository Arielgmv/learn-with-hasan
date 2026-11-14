#!/usr/bin/env python3
"""
Snake Game (Arcade GUI Edition)
Built with Pygame.
Features smooth rendering, eye animations, pulsing food, particle effects, and high scores.
"""

import sys
import os
import json
import random
import math

try:
    import pygame
except ImportError:
    print("\n" + "=" * 60)
    print(" Pygame is required to run the GUI edition.")
    print("=" * 60)
    print("To install Pygame in a virtual environment:")
    print("  python3 -m venv venv")
    print("  source venv/bin/activate")
    print("  pip install pygame")
    print("  python day_3/snake_gui.py")
    print("\nAlternatively, play the zero-dependency terminal edition right now:")
    print("  python3 day_3/snake.py")
    print("=" * 60 + "\n")
    sys.exit(0)

# Window Configuration
GRID_SIZE = 24
GRID_WIDTH = 28
GRID_HEIGHT = 24
SCREEN_WIDTH = GRID_WIDTH * GRID_SIZE
SCREEN_HEIGHT = GRID_HEIGHT * GRID_SIZE + 60  # +60 for HUD banner

# Colors
COLOR_BG = (18, 22, 34)
COLOR_GRID = (28, 34, 52)
COLOR_HUD_BG = (12, 15, 24)
COLOR_TEXT = (240, 244, 255)
COLOR_TEXT_DIM = (140, 150, 180)
COLOR_SNAKE_HEAD = (64, 224, 130)
COLOR_SNAKE_BODY = (40, 180, 99)
COLOR_SNAKE_EYE = (255, 255, 255)
COLOR_SNAKE_PUPIL = (18, 22, 34)
COLOR_FOOD = (255, 75, 75)
COLOR_FOOD_GLOW = (255, 120, 120)
COLOR_GOLDEN = (255, 215, 0)
COLOR_GOLDEN_GLOW = (255, 235, 120)

HIGH_SCORE_FILE = os.path.join(os.path.dirname(__file__), "highscore.json")


def load_high_score() -> int:
    try:
        if os.path.exists(HIGH_SCORE_FILE):
            with open(HIGH_SCORE_FILE, "r", encoding="utf-8") as f:
                return int(json.load(f).get("high_score", 0))
    except Exception:
        pass
    return 0


def save_high_score(score: int) -> None:
    try:
        current = load_high_score()
        if score > current:
            with open(HIGH_SCORE_FILE, "w", encoding="utf-8") as f:
                json.dump({"high_score": score}, f)
    except Exception:
        pass


class Particle:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.color = color
        angle = random.uniform(0, 2 * math.pi)
        speed = random.uniform(1.5, 4.0)
        self.vx = math.cos(angle) * speed
        self.vy = math.sin(angle) * speed
        self.life = 1.0
        self.decay = random.uniform(0.03, 0.06)
        self.size = random.uniform(2.5, 5.0)

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= self.decay

    def draw(self, surface):
        if self.life > 0:
            alpha = max(0, min(255, int(self.life * 255)))
            r, g, b = self.color
            radius = max(1, int(self.size * self.life))
            temp_surf = pygame.Surface((radius * 2, radius * 2), pygame.SRCALPHA)
            pygame.draw.circle(temp_surf, (r, g, b, alpha), (radius, radius), radius)
            surface.blit(temp_surf, (int(self.x - radius), int(self.y - radius)))


class FloatingText:
    def __init__(self, x, y, text, color, font):
        self.x = x
        self.y = y
        self.text = text
        self.color = color
        self.font = font
        self.alpha = 255
        self.vy = -1.2

    def update(self):
        self.y += self.vy
        self.alpha = max(0, self.alpha - 6)

    def draw(self, surface):
        if self.alpha > 0:
            rendered = self.font.render(self.text, True, self.color)
            rendered.set_alpha(self.alpha)
            surface.blit(rendered, (self.x, self.y))


class SnakeGame:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("Snake 🐍")
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()

        # Fonts
        self.font_large = pygame.font.SysFont("sans-serif", 46, bold=True)
        self.font_medium = pygame.font.SysFont("sans-serif", 28, bold=True)
        self.font_small = pygame.font.SysFont("sans-serif", 18)

        self.high_score = load_high_score()
        self.reset()

    def reset(self):
        mid_x = GRID_WIDTH // 2
        mid_y = GRID_HEIGHT // 2
        self.snake = [(mid_x, mid_y), (mid_x - 1, mid_y), (mid_x - 2, mid_y)]
        self.direction = (1, 0)
        self.next_direction = (1, 0)
        self.score = 0
        self.game_over = False
        self.paused = False
        self.particles = []
        self.floating_texts = []
        self.golden_food = None
        self.golden_timer = 0
        self.food = self.spawn_food()
        self.ticks = 0
        self.step_delay = 110  # ms per move
        self.last_move_time = pygame.time.get_ticks()

    def spawn_food(self):
        occupied = set(self.snake)
        if getattr(self, "golden_food", None):
            occupied.add(self.golden_food)
        while True:
            pos = (random.randint(0, GRID_WIDTH - 1), random.randint(0, GRID_HEIGHT - 1))
            if pos not in occupied:
                return pos

    def spawn_golden(self):
        occupied = set(self.snake)
        occupied.add(self.food)
        while True:
            pos = (random.randint(0, GRID_WIDTH - 1), random.randint(0, GRID_HEIGHT - 1))
            if pos not in occupied:
                return pos

    def add_burst(self, grid_x, grid_y, color, count=16):
        px = grid_x * GRID_SIZE + GRID_SIZE // 2
        py = grid_y * GRID_SIZE + 60 + GRID_SIZE // 2
        for _ in range(count):
            self.particles.append(Particle(px, py, color))

    def handle_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE or event.key == pygame.K_q:
                    return False

                if event.key == pygame.K_p or event.key == pygame.K_SPACE:
                    if not self.game_over:
                        self.paused = not self.paused

                if self.game_over:
                    if event.key == pygame.K_r:
                        self.reset()

                # Direction controls
                dx, dy = self.direction
                if (event.key == pygame.K_UP or event.key == pygame.K_w) and dy != 1:
                    self.next_direction = (0, -1)
                elif (event.key == pygame.K_DOWN or event.key == pygame.K_s) and dy != -1:
                    self.next_direction = (0, 1)
                elif (event.key == pygame.K_LEFT or event.key == pygame.K_a) and dx != 1:
                    self.next_direction = (-1, 0)
                elif (event.key == pygame.K_RIGHT or event.key == pygame.K_d) and dx != -1:
                    self.next_direction = (1, 0)

        return True

    def update(self):
        current_time = pygame.time.get_ticks()

        # Update visuals
        for p in self.particles[:]:
            p.update()
            if p.life <= 0:
                self.particles.remove(p)

        for ft in self.floating_texts[:]:
            ft.update()
            if ft.alpha <= 0:
                self.floating_texts.remove(ft)

        if self.paused or self.game_over:
            return

        # Check move interval
        if current_time - self.last_move_time < self.step_delay:
            return

        self.last_move_time = current_time
        self.direction = self.next_direction

        head_x, head_y = self.snake[0]
        dx, dy = self.direction
        new_head = (head_x + dx, head_y + dy)

        # Boundary collision
        nx, ny = new_head
        if nx < 0 or nx >= GRID_WIDTH or ny < 0 or ny >= GRID_HEIGHT:
            self.trigger_game_over()
            return

        # Self collision
        if new_head in self.snake:
            self.trigger_game_over()
            return

        self.snake.insert(0, new_head)

        # Eating food
        ate = False
        if new_head == self.food:
            self.score += 10
            ate = True
            self.add_burst(nx, ny, COLOR_FOOD)
            px = nx * GRID_SIZE
            py = ny * GRID_SIZE + 60
            self.floating_texts.append(FloatingText(px, py, "+10", (255, 230, 100), self.font_small))
            self.food = self.spawn_food()

            # Progressive speed up
            self.step_delay = max(55, int(110 - (len(self.snake) * 1.2)))

            # 25% chance of bonus golden fruit
            if self.golden_food is None and random.random() < 0.25:
                self.golden_food = self.spawn_golden()
                self.golden_timer = 40  # steps active

        elif self.golden_food and new_head == self.golden_food:
            self.score += 35
            ate = True
            self.add_burst(nx, ny, COLOR_GOLDEN, count=24)
            px = nx * GRID_SIZE
            py = ny * GRID_SIZE + 60
            self.floating_texts.append(FloatingText(px, py, "+35 BONUS!", COLOR_GOLDEN, self.font_medium))
            self.golden_food = None
            self.golden_timer = 0

        if not ate:
            self.snake.pop()

        if self.golden_food:
            self.golden_timer -= 1
            if self.golden_timer <= 0:
                self.golden_food = None

    def trigger_game_over(self):
        self.game_over = True
        head_x, head_y = self.snake[0]
        self.add_burst(head_x, head_y, (255, 60, 60), count=30)
        if self.score > self.high_score:
            self.high_score = self.score
            save_high_score(self.high_score)

    def draw(self):
        self.screen.fill(COLOR_BG)

        # Draw HUD Banner
        hud_rect = pygame.Rect(0, 0, SCREEN_WIDTH, 60)
        pygame.draw.rect(self.screen, COLOR_HUD_BG, hud_rect)
        pygame.draw.line(self.screen, COLOR_GRID, (0, 60), (SCREEN_WIDTH, 60), 2)

        # HUD Text
        score_surf = self.font_medium.render(f"SCORE: {self.score}", True, COLOR_TEXT)
        self.screen.blit(score_surf, (20, 16))

        best_surf = self.font_medium.render(f"BEST: {max(self.score, self.high_score)}", True, COLOR_GOLDEN)
        self.screen.blit(best_surf, (SCREEN_WIDTH // 2 - best_surf.get_width() // 2, 16))

        info_surf = self.font_small.render("P: Pause | R: Restart", True, COLOR_TEXT_DIM)
        self.screen.blit(info_surf, (SCREEN_WIDTH - info_surf.get_width() - 20, 22))

        # Draw subtle grid
        for x in range(0, SCREEN_WIDTH, GRID_SIZE):
            pygame.draw.line(self.screen, COLOR_GRID, (x, 60), (x, SCREEN_HEIGHT))
        for y in range(60, SCREEN_HEIGHT, GRID_SIZE):
            pygame.draw.line(self.screen, COLOR_GRID, (0, y), (SCREEN_WIDTH, y))

        # Pulse animation for food
        now = pygame.time.get_ticks()
        pulse = (math.sin(now * 0.008) + 1.0) / 2.0  # 0.0 to 1.0

        # Draw regular food
        fx, fy = self.food
        fcx = fx * GRID_SIZE + GRID_SIZE // 2
        fcy = fy * GRID_SIZE + 60 + GRID_SIZE // 2
        fradius = int(GRID_SIZE * 0.38 + pulse * 2.5)
        pygame.draw.circle(self.screen, COLOR_FOOD_GLOW, (fcx, fcy), fradius + 2)
        pygame.draw.circle(self.screen, COLOR_FOOD, (fcx, fcy), fradius)

        # Draw golden food if present
        if self.golden_food:
            gx, gy = self.golden_food
            gcx = gx * GRID_SIZE + GRID_SIZE // 2
            gcy = gy * GRID_SIZE + 60 + GRID_SIZE // 2
            gradius = int(GRID_SIZE * 0.44 + (1 - pulse) * 3)
            pygame.draw.circle(self.screen, COLOR_GOLDEN_GLOW, (gcx, gcy), gradius + 3)
            pygame.draw.circle(self.screen, COLOR_GOLDEN, (gcx, gcy), gradius)

        # Draw snake body
        for i, (bx, by) in enumerate(self.snake[1:]):
            rect = pygame.Rect(bx * GRID_SIZE + 2, by * GRID_SIZE + 62, GRID_SIZE - 4, GRID_SIZE - 4)
            # Gentle color gradient towards the tail
            fade = max(0.6, 1.0 - (i / max(1, len(self.snake) * 1.5)))
            color = (int(COLOR_SNAKE_BODY[0] * fade), int(COLOR_SNAKE_BODY[1] * fade), int(COLOR_SNAKE_BODY[2] * fade))
            pygame.draw.rect(self.screen, color, rect, border_radius=6)

        # Draw snake head
        hx, hy = self.snake[0]
        head_rect = pygame.Rect(hx * GRID_SIZE + 1, hy * GRID_SIZE + 61, GRID_SIZE - 2, GRID_SIZE - 2)
        pygame.draw.rect(self.screen, COLOR_SNAKE_HEAD, head_rect, border_radius=8)

        # Draw eyes on snake head based on direction
        dx, dy = self.direction
        hcx = hx * GRID_SIZE + GRID_SIZE // 2
        hcy = hy * GRID_SIZE + 60 + GRID_SIZE // 2

        if dx != 0:
            eye1 = (hcx + dx * 4, hcy - 5)
            eye2 = (hcx + dx * 4, hcy + 5)
        else:
            eye1 = (hcx - 5, hcy + dy * 4)
            eye2 = (hcx + 5, hcy + dy * 4)

        for eye in (eye1, eye2):
            pygame.draw.circle(self.screen, COLOR_SNAKE_EYE, eye, 3)
            pygame.draw.circle(self.screen, COLOR_SNAKE_PUPIL, (eye[0] + dx, eye[1] + dy), 1)

        # Draw particles
        for p in self.particles:
            p.draw(self.screen)

        # Draw floating texts
        for ft in self.floating_texts:
            ft.draw(self.screen)

        # Paused Overlay
        if self.paused and not self.game_over:
            overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            overlay.fill((10, 14, 22, 180))
            self.screen.blit(overlay, (0, 0))
            pause_surf = self.font_large.render("PAUSED", True, COLOR_GOLDEN)
            sub_surf = self.font_small.render("Press SPACE or P to Resume", True, COLOR_TEXT)
            self.screen.blit(pause_surf, (SCREEN_WIDTH // 2 - pause_surf.get_width() // 2, SCREEN_HEIGHT // 2 - 40))
            self.screen.blit(sub_surf, (SCREEN_WIDTH // 2 - sub_surf.get_width() // 2, SCREEN_HEIGHT // 2 + 15))

        # Game Over Overlay
        if self.game_over:
            overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            overlay.fill((10, 14, 22, 205))
            self.screen.blit(overlay, (0, 0))

            over_surf = self.font_large.render("GAME OVER", True, (255, 80, 80))
            final_surf = self.font_medium.render(f"Final Score: {self.score}", True, COLOR_TEXT)
            restart_surf = self.font_small.render("Press [R] to Play Again   •   [Q] to Quit", True, COLOR_TEXT_DIM)

            self.screen.blit(over_surf, (SCREEN_WIDTH // 2 - over_surf.get_width() // 2, SCREEN_HEIGHT // 2 - 60))
            self.screen.blit(final_surf, (SCREEN_WIDTH // 2 - final_surf.get_width() // 2, SCREEN_HEIGHT // 2 - 5))
            self.screen.blit(restart_surf, (SCREEN_WIDTH // 2 - restart_surf.get_width() // 2, SCREEN_HEIGHT // 2 + 45))

        pygame.display.flip()

    def run(self):
        running = True
        while running:
            running = self.handle_input()
            self.update()
            self.draw()
            self.clock.tick(60)

        pygame.quit()


def main():
    game = SnakeGame()
    game.run()


if __name__ == "__main__":
    main()
