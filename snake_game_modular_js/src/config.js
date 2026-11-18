/**
 * Game Configuration and Constants
 * Mirrors the Python modular structure for grid dimensions, speeds, and scoring.
 */

// Grid & Display Dimensions
export const GRID_CELL_SIZE = 24;
export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 24;
export const HUD_HEIGHT = 60;

export const SCREEN_WIDTH = GRID_WIDTH * GRID_CELL_SIZE;   // 672px
export const SCREEN_HEIGHT = GRID_HEIGHT * GRID_CELL_SIZE + HUD_HEIGHT; // 636px

export const TARGET_FPS = 60;

// Gameplay Speeds (milliseconds per grid step)
export const INITIAL_STEP_DELAY = 110;
export const MIN_STEP_DELAY = 50;
export const SPEED_SCALING_FACTOR = 1.25; // ms decrease per snake segment

// Scoring & Golden Food Mechanics
export const REGULAR_FOOD_POINTS = 10;
export const GOLDEN_FOOD_POINTS = 35;
export const GOLDEN_FOOD_SPAWN_CHANCE = 0.25;
export const GOLDEN_FOOD_LIFETIME_TICKS = 42;

// Storage Key
export const STORAGE_KEY_HIGH_SCORE = 'snake_arcade_high_score';
