"""
Game Over Screen State
"""

import pygame
from src.states.base_state import BaseState


class GameOverState(BaseState):
    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_r, pygame.K_SPACE, pygame.K_RETURN):
                self.game.start_new_game()
            elif event.key in (pygame.K_ESCAPE, pygame.K_q):
                self.game.quit()

    def update(self) -> None:
        # Keep dying particles updating on game over
        self.game.particle_system.update()

    def draw(self) -> None:
        self.game.play_state.draw()
        self.game.renderer.draw_game_over_overlay(
            final_score=self.game.score,
            high_score=self.game.high_score,
            is_new_record=self.game.is_new_record,
        )
