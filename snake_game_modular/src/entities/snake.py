"""
Snake Entity and Direction Model
"""

from enum import Enum


class Direction(Enum):
    UP = (0, -1)
    DOWN = (0, 1)
    LEFT = (-1, 0)
    RIGHT = (1, 0)

    @property
    def opposite(self) -> "Direction":
        opposites = {
            Direction.UP: Direction.DOWN,
            Direction.DOWN: Direction.UP,
            Direction.LEFT: Direction.RIGHT,
            Direction.RIGHT: Direction.LEFT,
        }
        return opposites[self]


class Snake:
    def __init__(self, start_x: int, start_y: int, initial_length: int = 3):
        self.body: list[tuple[int, int]] = []
        self.direction: Direction = Direction.RIGHT
        self.next_direction: Direction = Direction.RIGHT
        self.reset(start_x, start_y, initial_length)

    def reset(self, start_x: int, start_y: int, initial_length: int = 3) -> None:
        self.direction = Direction.RIGHT
        self.next_direction = Direction.RIGHT
        self.body = [(start_x - i, start_y) for i in range(initial_length)]

    @property
    def head(self) -> tuple[int, int]:
        return self.body[0]

    @property
    def length(self) -> int:
        return len(self.body)

    def queue_direction(self, new_dir: Direction) -> None:
        """Buffers direction change, preventing 180-degree instant reversal into itself."""
        if new_dir != self.direction.opposite:
            self.next_direction = new_dir

    def step(self, grow: bool = False) -> tuple[int, int]:
        """
        Advances the snake one unit in its next direction.
        Returns the new head position.
        """
        self.direction = self.next_direction
        dx, dy = self.direction.value
        head_x, head_y = self.head
        new_head = (head_x + dx, head_y + dy)

        self.body.insert(0, new_head)
        if not grow:
            self.body.pop()

        return new_head

    def check_self_collision(self) -> bool:
        """Returns True if the head occupies any other segment of its body."""
        return self.head in self.body[1:]

    def check_boundary_collision(self, max_width: int, max_height: int) -> bool:
        """Returns True if the head has struck the grid walls."""
        hx, hy = self.head
        return hx < 0 or hx >= max_width or hy < 0 or hy >= max_height

    def occupies(self, pos: tuple[int, int]) -> bool:
        return pos in self.body
