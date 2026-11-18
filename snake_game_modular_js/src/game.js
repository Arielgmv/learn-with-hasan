/**
 * Game Engine and Main Loop Coordinator
 * Coordinates entities, state machines, canvas context, and animation frames.
 */

import {
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    GRID_WIDTH,
    GRID_HEIGHT,
    REGULAR_FOOD_POINTS
} from './config.js';

import { HighScoreManager } from './storage.js';
import { Snake, Direction } from './entities/snake.js';
import { Food, spawnFoodPosition } from './entities/food.js';
import { ParticleSystem } from './entities/particles.js';
import { Renderer } from './ui/renderer.js';

import { StartState } from './states/start_state.js';
import { PlayState } from './states/play_state.js';
import { PauseState } from './states/pause_state.js';
import { GameOverState } from './states/game_over_state.js';

export class Game {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.width = SCREEN_WIDTH;
        this.canvas.height = SCREEN_HEIGHT;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to acquire 2D rendering context from canvas.');
        }

        // Subsystems
        this.storage = new HighScoreManager();
        this.highScore = this.storage.loadHighScore();
        this.renderer = new Renderer(ctx);
        this.particleSystem = new ParticleSystem();

        // Entities
        this.snake = new Snake(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT / 2));
        this.food = new Food(this._spawnInitialFood(), REGULAR_FOOD_POINTS);
        this.goldenFood = null;
        this.score = 0;
        this.isNewRecord = false;

        // States
        this.startState = new StartState(this);
        this.playState = new PlayState(this);
        this.pauseState = new PauseState(this);
        this.gameOverState = new GameOverState(this);

        this.currentState = this.startState;
        this.isRunning = false;
        this.lastFrameTime = performance.now();

        this._setupEventListeners();
    }

    _spawnInitialFood() {
        const occupied = new Set(this.snake.body.map(seg => `${seg.x},${seg.y}`));
        return spawnFoodPosition(GRID_WIDTH, GRID_HEIGHT, occupied);
    }

    _setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.handleInput(e);
        });
    }

    changeState(nextState) {
        if (this.currentState) {
            this.currentState.onExit();
        }
        this.currentState = nextState;
        this.currentState.onEnter();
    }

    startNewGame() {
        this.snake.reset(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT / 2));
        this.goldenFood = null;
        this.food = new Food(this._spawnInitialFood(), REGULAR_FOOD_POINTS);
        this.score = 0;
        this.isNewRecord = false;
        this.particleSystem.clear();
        this.changeState(this.playState);
    }

    pushPause() {
        if (this.currentState === this.playState) {
            this.changeState(this.pauseState);
        }
    }

    popPause() {
        if (this.currentState === this.pauseState) {
            this.changeState(this.playState);
        }
    }

    triggerGameOver() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.storage.saveHighScore(this.highScore);
            this.isNewRecord = true;
        } else {
            this.isNewRecord = false;
        }
        this.changeState(this.gameOverState);
    }

    handleInput(event) {
        if (this.currentState) {
            this.currentState.handleInput(event);
        }
    }

    /**
     * Programmatic trigger for on-screen virtual controls (touch/click).
     * @param {'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'PAUSE' | 'START' | 'RESTART'} action
     */
    triggerAction(action) {
        if (this.currentState === this.startState) {
            if (action === 'START' || action === 'RESTART' || action === 'PAUSE') {
                this.startNewGame();
                return;
            }
        }

        if (this.currentState === this.gameOverState) {
            if (action === 'RESTART' || action === 'START' || action === 'PAUSE') {
                this.startNewGame();
                return;
            }
        }

        if (this.currentState === this.pauseState) {
            if (action === 'PAUSE' || action === 'START') {
                this.popPause();
                return;
            }
        }

        if (this.currentState === this.playState) {
            switch (action) {
                case 'UP':
                    this.snake.queueDirection(Direction.UP);
                    break;
                case 'DOWN':
                    this.snake.queueDirection(Direction.DOWN);
                    break;
                case 'LEFT':
                    this.snake.queueDirection(Direction.LEFT);
                    break;
                case 'RIGHT':
                    this.snake.queueDirection(Direction.RIGHT);
                    break;
                case 'PAUSE':
                    this.pushPause();
                    break;
                case 'RESTART':
                    this.startNewGame();
                    break;
            }
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();

        const loop = (currentTime) => {
            if (!this.isRunning) return;

            const dt = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;

            this.currentState.update(dt);
            this.currentState.draw();

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    stop() {
        this.isRunning = false;
    }
}
