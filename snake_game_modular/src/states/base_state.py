"""
Abstract Base State for Extensible Game Screen Flow
"""

from abc import ABC, abstractmethod
import pygame


class BaseState(ABC):
    def __init__(self, game):
        self.game = game

    def on_enter(self) -> None:
        """Called when transitioning into this state."""
        pass

    def on_exit(self) -> None:
        """Called when transitioning out of this state."""
        pass

    @abstractmethod
    def handle_event(self, event: pygame.event.Event) -> None:
        """Handle individual input events."""
        pass

    @abstractmethod
    def update(self) -> None:
        """State logic tick."""
        pass

    @abstractmethod
    def draw(self) -> None:
        """Render routine for the state."""
        pass
