/**
 * Snake Arcade (Modular Edition) - Web Application Entry Point
 */

import { Game } from './src/game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element #gameCanvas not found.');
        return;
    }

    const game = new Game(canvas);
    game.start();

    // Hook up on-screen virtual d-pad controls for mobile and mouse users
    const controlButtons = document.querySelectorAll('[data-action]');
    controlButtons.forEach((btn) => {
        const action = btn.getAttribute('data-action');
        if (!action) return;

        const trigger = (e) => {
            e.preventDefault();
            game.triggerAction(action);
        };

        btn.addEventListener('click', trigger);
        btn.addEventListener('touchstart', trigger, { passive: false });
    });

    // Prevent default scrolling on arrow keys and space inside window
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    }, { passive: false });

    // Expose game instance for debugging or console testing
    window.__SNAKE_GAME__ = game;
});
