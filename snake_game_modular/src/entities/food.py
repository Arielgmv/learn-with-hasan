"""
Food Entities and Spawning Logic
"""

import random
from typing import Set, Tuple


class Food:
    def __init__(self, position: Tuple[int, int], points: int = 10):
        self.position = position
        self.points = points


class GoldenFood(Food):
    def __init__(self, position: Tuple[int, int], points: int = 35, duration_ticks: int = 42):
        super().__init__(position, points)
        self.duration_ticks = duration_ticks
        self.remaining_ticks = duration_ticks

    def tick(self) -> None:
        if self.remaining_ticks > 0:
            self.remaining_ticks -= 1

    @property
    def is_expired(self) -> bool:
        return self.remaining_ticks <= 0


def spawn_food_position(
    grid_width: int,
    grid_height: int,
    occupied_positions: Set[Tuple[int, int]],
) -> Tuple[int, int]:
    """
    Finds a random vacant grid tile.
    If the board is almost full, falls back to a scan.
    """
    total_cells = grid_width * grid_height
    if len(occupied_positions) >= total_cells:
        return (0, 0)

    # Fast randomized trial
    for _ in range(150):
        pos = (random.randint(0, grid_width - 1), random.randint(0, grid_height - 1))
        if pos not in occupied_positions:
            return pos

    # Deterministic fallback when dense
    vacant = [
        (x, y)
        for x in range(grid_width)
        for y in range(grid_height)
        if (x, y) not in occupied_positions
    ]
    return random.choice(vacant) if vacant else (0, 0)
