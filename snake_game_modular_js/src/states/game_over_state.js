/**
 * Game Over Screen State
 */

import { BaseState } from './base_state.js';

export class GameOverState extends BaseState {
    handleInput(event) {
        if (event.type === 'keydown') {
            if (event.code === 'KeyR' || event.code === 'Space' || event.code === 'Enter') {
                event.preventDefault();
                this.game.startNewGame();
            }
        }
    }

    update(dt) {
        // Keep particles animating on death
        this.game.particleSystem.update();
    }

    draw() {
        this.game.playState.draw();
        this.game.renderer.drawGameOverOverlay(
            this.game.score,
            this.game.highScore,
            this.game.isNewRecord
        );
    }
}
