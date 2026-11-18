/**
 * Persistence Layer
 * Handles loading and saving high scores using browser localStorage with in-memory fallback.
 */

import { STORAGE_KEY_HIGH_SCORE } from './config.js';

export class HighScoreManager {
    constructor(storageKey = STORAGE_KEY_HIGH_SCORE) {
        this.storageKey = storageKey;
        this.memoryFallback = 0;
        this.isLocalStorageAvailable = this._checkLocalStorage();
    }

    _checkLocalStorage() {
        try {
            const testKey = '__storage_test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }

    loadHighScore() {
        if (!this.isLocalStorageAvailable) {
            return this.memoryFallback;
        }
        try {
            const raw = window.localStorage.getItem(this.storageKey);
            const val = parseInt(raw, 10);
            return Number.isFinite(val) ? val : 0;
        } catch {
            return this.memoryFallback;
        }
    }

    saveHighScore(score) {
        const current = this.loadHighScore();
        if (score <= current) {
            return false;
        }

        this.memoryFallback = score;

        if (this.isLocalStorageAvailable) {
            try {
                window.localStorage.setItem(this.storageKey, score.toString());
                return true;
            } catch {
                return false;
            }
        }
        return true;
    }
}
