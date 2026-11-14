"""
Pause Overlay State
"""

import pygame
from src.states.base_state import BaseState


class PauseState(BaseState):
    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_SPACE, pygame.K_p):
                self.game.pop_pause()
            elif event.key in (pygame.K_ESCAPE, pygame.K_q):
                self.game.quit()

    def update(self) -> None:
        # Freeze entities during pause
        pass

    def draw(self) -> None:
        # Render the frozen game field beneath the overlay
        self.game.play_state.draw()
        self.game.renderer.draw_pause_overlay()
