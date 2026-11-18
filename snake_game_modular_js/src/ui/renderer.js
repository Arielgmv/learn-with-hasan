/**
 * Arcade HTML5 Canvas Renderer
 * Translates game state and entities onto the 2D canvas with high fidelity visuals.
 */

import {
    GRID_CELL_SIZE,
    HUD_HEIGHT,
    SCREEN_WIDTH,
    SCREEN_HEIGHT
} from '../config.js';

import {
    COLOR_BG,
    COLOR_GRID,
    COLOR_HUD_BG,
    COLOR_SNAKE_HEAD,
    COLOR_SNAKE_BODY,
    COLOR_SNAKE_EYE,
    COLOR_SNAKE_PUPIL,
    COLOR_FOOD,
    COLOR_FOOD_GLOW,
    COLOR_GOLDEN,
    COLOR_GOLDEN_GLOW,
    COLOR_TEXT_PRIMARY,
    COLOR_TEXT_DIM,
    COLOR_TEXT_ACCENT,
    COLOR_GAME_OVER,
    COLOR_OVERLAY_PAUSE,
    COLOR_OVERLAY_MODAL
} from '../theme.js';

export class Renderer {
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    clear() {
        this.ctx.fillStyle = COLOR_BG;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    drawGrid() {
        this.ctx.strokeStyle = COLOR_GRID;
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        // Vertical lines
        for (let x = 0; x <= SCREEN_WIDTH; x += GRID_CELL_SIZE) {
            this.ctx.moveTo(x + 0.5, HUD_HEIGHT);
            this.ctx.lineTo(x + 0.5, SCREEN_HEIGHT);
        }
        // Horizontal lines
        for (let y = HUD_HEIGHT; y <= SCREEN_HEIGHT; y += GRID_CELL_SIZE) {
            this.ctx.moveTo(0, y + 0.5);
            this.ctx.lineTo(SCREEN_WIDTH, y + 0.5);
        }
        this.ctx.stroke();
    }

    drawHud(score, highScore) {
        // Banner backdrop
        this.ctx.fillStyle = COLOR_HUD_BG;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, HUD_HEIGHT);

        // Divider line
        this.ctx.strokeStyle = COLOR_GRID;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, HUD_HEIGHT);
        this.ctx.lineTo(SCREEN_WIDTH, HUD_HEIGHT);
        this.ctx.stroke();

        // Current score
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.fillStyle = COLOR_TEXT_PRIMARY;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`SCORE: ${score}`, 20, HUD_HEIGHT / 2);

        // Best / High score
        const best = Math.max(score, highScore);
        this.ctx.fillStyle = COLOR_TEXT_ACCENT;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`BEST: ${best}`, SCREEN_WIDTH / 2, HUD_HEIGHT / 2);

        // Quick hint
        this.ctx.font = '14px sans-serif';
        this.ctx.fillStyle = COLOR_TEXT_DIM;
        this.ctx.textAlign = 'right';
        this.ctx.fillText('P: Pause | R: Restart', SCREEN_WIDTH - 20, HUD_HEIGHT / 2);
    }

    drawSnake(snake) {
        // Draw body segments with soft gradient fade
        const length = snake.length;
        for (let i = 1; i < length; i++) {
            const seg = snake.body[i];
            const px = seg.x * GRID_CELL_SIZE + 2;
            const py = seg.y * GRID_CELL_SIZE + HUD_HEIGHT + 2;
            const size = GRID_CELL_SIZE - 4;

            const fade = Math.max(0.55, 1.0 - (i / Math.max(1, length * 1.4)));
            this.ctx.fillStyle = `rgb(${Math.floor(40 * fade)}, ${Math.floor(180 * fade)}, ${Math.floor(99 * fade)})`;
            this._drawRoundRect(px, py, size, size, 6);
        }

        // Draw head
        const head = snake.head;
        const hx = head.x * GRID_CELL_SIZE + 1;
        const hy = head.y * GRID_CELL_SIZE + HUD_HEIGHT + 1;
        const hSize = GRID_CELL_SIZE - 2;

        this.ctx.fillStyle = COLOR_SNAKE_HEAD;
        this._drawRoundRect(hx, hy, hSize, hSize, 8);

        // Draw directional eyes
        const dx = snake.direction.x;
        const dy = snake.direction.y;
        const cx = head.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
        const cy = head.y * GRID_CELL_SIZE + HUD_HEIGHT + GRID_CELL_SIZE / 2;

        let eye1, eye2;
        if (dx !== 0) {
            eye1 = { x: cx + dx * 4, y: cy - 5 };
            eye2 = { x: cx + dx * 4, y: cy + 5 };
        } else {
            eye1 = { x: cx - 5, y: cy + dy * 4 };
            eye2 = { x: cx + 5, y: cy + dy * 4 };
        }

        for (const eye of [eye1, eye2]) {
            // Sclera
            this.ctx.fillStyle = COLOR_SNAKE_EYE;
            this.ctx.beginPath();
            this.ctx.arc(eye.x, eye.y, 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Pupil looking forward
            this.ctx.fillStyle = COLOR_SNAKE_PUPIL;
            this.ctx.beginPath();
            this.ctx.arc(eye.x + dx, eye.y + dy, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawFood(food, nowMs) {
        const { x, y } = food.position;
        const pulse = (Math.sin(nowMs * 0.008) + 1.0) / 2.0; // 0.0 to 1.0
        const cx = x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
        const cy = y * GRID_CELL_SIZE + HUD_HEIGHT + GRID_CELL_SIZE / 2;
        const radius = GRID_CELL_SIZE * 0.38 + pulse * 2.5;

        // Glowing outer halo
        this.ctx.fillStyle = COLOR_FOOD_GLOW;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Main core
        this.ctx.fillStyle = COLOR_FOOD;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawGoldenFood(goldenFood, nowMs) {
        if (!goldenFood || goldenFood.isExpired) return;

        const { x, y } = goldenFood.position;
        const pulse = (Math.cos(nowMs * 0.012) + 1.0) / 2.0;
        const cx = x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
        const cy = y * GRID_CELL_SIZE + HUD_HEIGHT + GRID_CELL_SIZE / 2;
        const radius = GRID_CELL_SIZE * 0.44 + pulse * 3.0;

        // Glowing golden halo
        this.ctx.fillStyle = COLOR_GOLDEN_GLOW;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Core golden orb
        this.ctx.fillStyle = COLOR_GOLDEN;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPauseOverlay() {
        this.ctx.fillStyle = COLOR_OVERLAY_PAUSE;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.font = 'bold 44px sans-serif';
        this.ctx.fillStyle = COLOR_TEXT_ACCENT;
        this.ctx.fillText('PAUSED', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 25);

        this.ctx.font = '18px sans-serif';
        this.ctx.fillStyle = COLOR_TEXT_PRIMARY;
        this.ctx.fillText('Press SPACE or P to Resume', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 25);
    }

    drawGameOverOverlay(finalScore, highScore, isNewRecord) {
        this.ctx.fillStyle = COLOR_OVERLAY_MODAL;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Title
        this.ctx.font = 'bold 44px sans-serif';
        this.ctx.fillStyle = COLOR_GAME_OVER;
        this.ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 65);

        // Final Score
        this.ctx.font = 'bold 26px sans-serif';
        this.ctx.fillStyle = COLOR_TEXT_PRIMARY;
        this.ctx.fillText(`Final Score: ${finalScore}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 12);

        // Record flag
        this.ctx.font = '18px sans-serif';
        if (isNewRecord) {
            this.ctx.fillStyle = COLOR_TEXT_ACCENT;
            this.ctx.fillText('★ NEW HIGH SCORE! ★', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 26);
        } else {
            this.ctx.fillStyle = COLOR_TEXT_DIM;
            this.ctx.fillText(`High Score: ${highScore}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 26);
        }

        // Restart prompt
        this.ctx.font = '16px sans-serif';
        this.ctx.fillStyle = COLOR_TEXT_PRIMARY;
        this.ctx.fillText('Press [R] to Play Again', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 70);
    }

    drawStartScreen(highScore) {
        this.ctx.fillStyle = COLOR_OVERLAY_MODAL;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Title
        this.ctx.font = 'bold 44px sans-serif';
        this.ctx.fillStyle = COLOR_SNAKE_HEAD;
        this.ctx.fillText('SNAKE ARCADE 🐍', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 70);

        // Call to action
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.fillStyle = COLOR_TEXT_PRIMARY;
        this.ctx.fillText('Press SPACE or ENTER to Play', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 10);

        // Controls
        this.ctx.font = '16px sans-serif';
        this.ctx.fillStyle = COLOR_TEXT_DIM;
        this.ctx.fillText('Controls: WASD or Arrow Keys', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 35);

        // High Score
        this.ctx.fillStyle = COLOR_TEXT_ACCENT;
        this.ctx.fillText(`Current High Score: ${highScore}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 75);
    }

    _drawRoundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.roundRect ? this.ctx.roundRect(x, y, width, height, radius) : this.ctx.rect(x, y, width, height);
        this.ctx.fill();
    }
}
