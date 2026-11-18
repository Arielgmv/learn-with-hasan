/**
 * Food Entities and Spawning Logic
 */

export class Food {
    constructor(position, points = 10) {
        this.position = position; // { x, y }
        this.points = points;
    }
}

export class GoldenFood extends Food {
    constructor(position, points = 35, durationTicks = 42) {
        super(position, points);
        this.durationTicks = durationTicks;
        this.remainingTicks = durationTicks;
    }

    tick() {
        if (this.remainingTicks > 0) {
            this.remainingTicks--;
        }
    }

    get isExpired() {
        return this.remainingTicks <= 0;
    }
}

/**
 * Finds a vacant random tile on the board.
 * @param {number} gridWidth
 * @param {number} gridHeight
 * @param {Set<string>} occupiedPositions - Set of "x,y" keys
 * @returns {{x: number, y: number}}
 */
export function spawnFoodPosition(gridWidth, gridHeight, occupiedPositions) {
    const totalCells = gridWidth * gridHeight;
    if (occupiedPositions.size >= totalCells) {
        return { x: 0, y: 0 };
    }

    // Fast randomized trials
    for (let i = 0; i < 150; i++) {
        const x = Math.floor(Math.random() * gridWidth);
        const y = Math.floor(Math.random() * gridHeight);
        if (!occupiedPositions.has(`${x},${y}`)) {
            return { x, y };
        }
    }

    // Deterministic fallback if grid is dense
    const vacant = [];
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            if (!occupiedPositions.has(`${x},${y}`)) {
                vacant.push({ x, y });
            }
        }
    }

    return vacant.length > 0 ? vacant[Math.floor(Math.random() * vacant.length)] : { x: 0, y: 0 };
}
