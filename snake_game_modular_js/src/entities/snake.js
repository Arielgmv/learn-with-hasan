/**
 * Snake Entity and Direction Definitions
 */

export const Direction = Object.freeze({
    UP: Object.freeze({ x: 0, y: -1, name: 'UP' }),
    DOWN: Object.freeze({ x: 0, y: 1, name: 'DOWN' }),
    LEFT: Object.freeze({ x: -1, y: 0, name: 'LEFT' }),
    RIGHT: Object.freeze({ x: 1, y: 0, name: 'RIGHT' })
});

export function isOppositeDirection(dirA, dirB) {
    return dirA.x + dirB.x === 0 && dirA.y + dirB.y === 0;
}

export class Snake {
    constructor(startX, startY, initialLength = 3) {
        this.body = [];
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        this.reset(startX, startY, initialLength);
    }

    reset(startX, startY, initialLength = 3) {
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        this.body = [];
        for (let i = 0; i < initialLength; i++) {
            this.body.push({ x: startX - i, y: startY });
        }
    }

    get head() {
        return this.body[0];
    }

    get length() {
        return this.body.length;
    }

    /**
     * Buffers a directional change, preventing 180-degree instant reversal into itself.
     */
    queueDirection(newDirection) {
        if (!isOppositeDirection(newDirection, this.direction)) {
            this.nextDirection = newDirection;
        }
    }

    /**
     * Advances the snake by one step.
     * @param {boolean} grow - Whether to retain the tail segment (when eating food).
     * @returns {{x: number, y: number}} New head position.
     */
    step(grow = false) {
        this.direction = this.nextDirection;
        const newHead = {
            x: this.head.x + this.direction.x,
            y: this.head.y + this.direction.y
        };

        this.body.unshift(newHead);
        if (!grow) {
            this.body.pop();
        }

        return newHead;
    }

    checkSelfCollision() {
        const head = this.head;
        for (let i = 1; i < this.body.length; i++) {
            if (this.body[i].x === head.x && this.body[i].y === head.y) {
                return true;
            }
        }
        return false;
    }

    checkBoundaryCollision(maxWidth, maxHeight) {
        const { x, y } = this.head;
        return x < 0 || x >= maxWidth || y < 0 || y >= maxHeight;
    }

    occupies(x, y) {
        return this.body.some(seg => seg.x === x && seg.y === y);
    }
}
