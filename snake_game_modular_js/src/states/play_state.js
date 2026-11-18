/**
 * Core Gameplay State
 */

import { BaseState } from './base_state.js';
import { Direction } from '../entities/snake.js';
import { Food, GoldenFood, spawnFoodPosition } from '../entities/food.js';
import { COLOR_FOOD, COLOR_GOLDEN, COLOR_GAME_OVER } from '../theme.js';
import {
    GRID_WIDTH,
    GRID_HEIGHT,
    INITIAL_STEP_DELAY,
    MIN_STEP_DELAY,
    SPEED_SCALING_FACTOR,
    REGULAR_FOOD_POINTS,
    GOLDEN_FOOD_POINTS,
    GOLDEN_FOOD_SPAWN_CHANCE,
    GOLDEN_FOOD_LIFETIME_TICKS
} from '../config.js';

export class PlayState extends BaseState {
    constructor(game) {
        super(game);
        this.stepDelay = INITIAL_STEP_DELAY;
        this.lastMoveTime = performance.now();
    }

    onEnter() {
        this.lastMoveTime = performance.now();
    }

    handleInput(event) {
        if (event.type !== 'keydown') return;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                event.preventDefault();
                this.game.snake.queueDirection(Direction.UP);
                break;
            case 'ArrowDown':
            case 'KeyS':
                event.preventDefault();
                this.game.snake.queueDirection(Direction.DOWN);
                break;
            case 'ArrowLeft':
            case 'KeyA':
                event.preventDefault();
                this.game.snake.queueDirection(Direction.LEFT);
                break;
            case 'ArrowRight':
            case 'KeyD':
                event.preventDefault();
                this.game.snake.queueDirection(Direction.RIGHT);
                break;
            case 'KeyP':
            case 'Space':
                event.preventDefault();
                this.game.pushPause();
                break;
            case 'KeyR':
                event.preventDefault();
                this.game.startNewGame();
                break;
        }
    }

    update(dt) {
        this.game.particleSystem.update();

        const currentTime = performance.now();
        if (currentTime - this.lastMoveTime < this.stepDelay) {
            return;
        }

        this.lastMoveTime = currentTime;

        // Tick golden food countdown
        if (this.game.goldenFood) {
            this.game.goldenFood.tick();
            if (this.game.goldenFood.isExpired) {
                this.game.goldenFood = null;
            }
        }

        // Predict next head coordinate
        const nextDir = this.game.snake.nextDirection;
        const currentHead = this.game.snake.head;
        const nextHead = {
            x: currentHead.x + nextDir.x,
            y: currentHead.y + nextDir.y
        };

        // Collision checks with food
        const ateRegular = this.game.food &&
            nextHead.x === this.game.food.position.x &&
            nextHead.y === this.game.food.position.y;

        const ateGolden = this.game.goldenFood &&
            nextHead.x === this.game.goldenFood.position.x &&
            nextHead.y === this.game.goldenFood.position.y;

        const shouldGrow = ateRegular || ateGolden;

        // Advance snake
        const newHead = this.game.snake.step(shouldGrow);

        // Boundary collision check
        if (this.game.snake.checkBoundaryCollision(GRID_WIDTH, GRID_HEIGHT)) {
            this.handleDeath();
            return;
        }

        // Self-collision check
        if (this.game.snake.checkSelfCollision()) {
            this.handleDeath();
            return;
        }

        // Handle regular food consumption
        if (ateRegular) {
            this.game.score += REGULAR_FOOD_POINTS;
            this.game.particleSystem.spawnBurst(newHead.x, newHead.y, COLOR_FOOD, 16);
            this.game.particleSystem.spawnFloatingText(
                newHead.x,
                newHead.y,
                `+${REGULAR_FOOD_POINTS}`,
                '#ffe664',
                '16px'
            );

            this.respawnRegularFood();

            // Dynamic speedup
            this.stepDelay = Math.max(
                MIN_STEP_DELAY,
                Math.floor(INITIAL_STEP_DELAY - (this.game.snake.length * SPEED_SCALING_FACTOR))
            );

            // Spawn golden bonus food with percentage chance
            if (!this.game.goldenFood && Math.random() < GOLDEN_FOOD_SPAWN_CHANCE) {
                this.spawnGoldenFood();
            }
        } else if (ateGolden) {
            this.game.score += GOLDEN_FOOD_POINTS;
            this.game.particleSystem.spawnBurst(newHead.x, newHead.y, COLOR_GOLDEN, 24);
            this.game.particleSystem.spawnFloatingText(
                newHead.x,
                newHead.y,
                `+${GOLDEN_FOOD_POINTS} BONUS!`,
                COLOR_GOLDEN,
                '18px'
            );
            this.game.goldenFood = null;
        }
    }

    respawnRegularFood() {
        const occupied = new Set(this.game.snake.body.map(seg => `${seg.x},${seg.y}`));
        if (this.game.goldenFood) {
            occupied.add(`${this.game.goldenFood.position.x},${this.game.goldenFood.position.y}`);
        }
        const pos = spawnFoodPosition(GRID_WIDTH, GRID_HEIGHT, occupied);
        this.game.food = new Food(pos, REGULAR_FOOD_POINTS);
    }

    spawnGoldenFood() {
        const occupied = new Set(this.game.snake.body.map(seg => `${seg.x},${seg.y}`));
        if (this.game.food) {
            occupied.add(`${this.game.food.position.x},${this.game.food.position.y}`);
        }
        const pos = spawnFoodPosition(GRID_WIDTH, GRID_HEIGHT, occupied);
        this.game.goldenFood = new GoldenFood(pos, GOLDEN_FOOD_POINTS, GOLDEN_FOOD_LIFETIME_TICKS);
    }

    handleDeath() {
        const head = this.game.snake.head;
        this.game.particleSystem.spawnBurst(head.x, head.y, COLOR_GAME_OVER, 32);
        this.game.triggerGameOver();
    }

    draw() {
        this.game.renderer.clear();
        this.game.renderer.drawGrid();

        const now = performance.now();
        if (this.game.food) {
            this.game.renderer.drawFood(this.game.food, now);
        }
        if (this.game.goldenFood) {
            this.game.renderer.drawGoldenFood(this.game.goldenFood, now);
        }

        this.game.renderer.drawSnake(this.game.snake);
        this.game.particleSystem.draw(this.game.renderer.ctx);
        this.game.renderer.drawHud(this.game.score, this.game.highScore);
    }
}
