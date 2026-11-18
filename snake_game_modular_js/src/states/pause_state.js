/**
 * Pause Overlay State
 */

import { BaseState } from './base_state.js';

export class PauseState extends BaseState {
    handleInput(event) {
        if (event.type === 'keydown') {
            if (event.code === 'Space' || event.code === 'KeyP') {
                event.preventDefault();
                this.game.popPause();
            }
        }
    }

    update(dt) {
        // Freeze logic during pause
    }

    draw() {
        // Render the paused game world beneath the overlay
        this.game.playState.draw();
        this.game.renderer.drawPauseOverlay();
    }
}
