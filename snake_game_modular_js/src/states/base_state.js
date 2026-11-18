/**
 * Abstract Base State for Extensible Game Screen Flow
 */

export class BaseState {
    /**
     * @param {import('../game.js').Game} game
     */
    constructor(game) {
        this.game = game;
    }

    onEnter() {}

    onExit() {}

    /**
     * @param {KeyboardEvent} event
     */
    handleInput(event) {}

    /**
     * @param {number} dt Delta time in milliseconds
     */
    update(dt) {}

    draw() {}
}
