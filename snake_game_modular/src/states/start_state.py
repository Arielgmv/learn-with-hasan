"""
Title and Start Screen State
"""

import pygame
from src.states.base_state import BaseState


class StartState(BaseState):
    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_SPACE, pygame.K_RETURN):
                self.game.start_new_game()
            elif event.key in (pygame.K_ESCAPE, pygame.K_q):
                self.game.quit()

    def update(self) -> None:
        pass

    def draw(self) -> None:
        self.game.renderer.clear()
        self.game.renderer.draw_grid()
        self.game.renderer.draw_start_screen(self.game.high_score)
