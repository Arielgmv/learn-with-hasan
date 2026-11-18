/**
 * Title and Start Screen State
 */

import { BaseState } from './base_state.js';

export class StartState extends BaseState {
    handleInput(event) {
        if (event.type === 'keydown') {
            if (event.code === 'Space' || event.code === 'Enter') {
                event.preventDefault();
                this.game.startNewGame();
            }
        }
    }

    update(dt) {}

    draw() {
        this.game.renderer.clear();
        this.game.renderer.drawGrid();
        this.game.renderer.drawStartScreen(this.game.highScore);
    }
}
