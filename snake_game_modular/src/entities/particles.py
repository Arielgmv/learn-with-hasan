"""
Visual Effects, Floating HUD Popups, and Particle Systems
"""

import math
import random
import pygame
from src.theme import Color


class Particle:
    def __init__(self, x: float, y: float, color: Color):
        self.x = x
        self.y = y
        self.color = color
        angle = random.uniform(0, 2 * math.pi)
        speed = random.uniform(1.6, 4.2)
        self.vx = math.cos(angle) * speed
        self.vy = math.sin(angle) * speed
        self.life = 1.0
        self.decay = random.uniform(0.03, 0.055)
        self.size = random.uniform(2.5, 4.5)

    def update(self) -> None:
        self.x += self.vx
        self.y += self.vy
        self.life -= self.decay

    def draw(self, surface: pygame.Surface) -> None:
        if self.life > 0:
            alpha = max(0, min(255, int(self.life * 255)))
            radius = max(1, int(self.size * self.life))
            temp_surf = pygame.Surface((radius * 2, radius * 2), pygame.SRCALPHA)
            r, g, b = self.color
            pygame.draw.circle(temp_surf, (r, g, b, alpha), (radius, radius), radius)
            surface.blit(temp_surf, (int(self.x - radius), int(self.y - radius)))


class FloatingText:
    def __init__(self, x: float, y: float, text: str, color: Color, font: pygame.font.Font):
        self.x = x
        self.y = y
        self.text = text
        self.color = color
        self.font = font
        self.alpha = 255
        self.vy = -1.25

    def update(self) -> None:
        self.y += self.vy
        self.alpha = max(0, self.alpha - 6)

    def draw(self, surface: pygame.Surface) -> None:
        if self.alpha > 0:
            rendered = self.font.render(self.text, True, self.color)
            rendered.set_alpha(self.alpha)
            surface.blit(rendered, (self.x, self.y))


class ParticleSystem:
    def __init__(self):
        self.particles: list[Particle] = []
        self.floating_texts: list[FloatingText] = []

    def spawn_burst(
        self,
        grid_x: int,
        grid_y: int,
        color: Color,
        count: int = 16,
        cell_size: int = 24,
        offset_y: int = 60,
    ) -> None:
        center_x = grid_x * cell_size + cell_size // 2
        center_y = grid_y * cell_size + offset_y + cell_size // 2
        for _ in range(count):
            self.particles.append(Particle(center_x, center_y, color))

    def spawn_floating_text(
        self,
        grid_x: int,
        grid_y: int,
        text: str,
        color: Color,
        font: pygame.font.Font,
        cell_size: int = 24,
        offset_y: int = 60,
    ) -> None:
        px = grid_x * cell_size
        py = grid_y * cell_size + offset_y
        self.floating_texts.append(FloatingText(px, py, text, color, font))

    def update(self) -> None:
        for p in self.particles[:]:
            p.update()
            if p.life <= 0:
                self.particles.remove(p)

        for ft in self.floating_texts[:]:
            ft.update()
            if ft.alpha <= 0:
                self.floating_texts.remove(ft)

    def draw(self, surface: pygame.Surface) -> None:
        for p in self.particles:
            p.draw(surface)
        for ft in self.floating_texts:
            ft.draw(surface)

    def clear(self) -> None:
        self.particles.clear()
        self.floating_texts.clear()
