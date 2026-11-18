/**
 * Visual Effects, Floating HUD Popups, and Particle Systems
 */

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.6 + Math.random() * 2.8;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = 0.03 + Math.random() * 0.03;
        this.size = 2.5 + Math.random() * 2.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.life));
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const radius = Math.max(1, this.size * this.life);
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class FloatingText {
    constructor(x, y, text, color, fontSize = '16px') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
        this.alpha = 1.0;
        this.vy = -1.25;
    }

    update() {
        this.y += this.vy;
        this.alpha -= 0.024;
    }

    draw(ctx) {
        if (this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.font = `bold ${this.fontSize} sans-serif`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
    }

    spawnBurst(gridX, gridY, color, count = 16, cellSize = 24, offsetY = 60) {
        const cx = gridX * cellSize + cellSize / 2;
        const cy = gridY * cellSize + offsetY + cellSize / 2;
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(cx, cy, color));
        }
    }

    spawnFloatingText(gridX, gridY, text, color, fontSize = '16px', cellSize = 24, offsetY = 60) {
        const px = gridX * cellSize + cellSize / 2;
        const py = gridY * cellSize + offsetY;
        this.floatingTexts.push(new FloatingText(px, py, text, color, fontSize));
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.update();
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
        for (const ft of this.floatingTexts) {
            ft.draw(ctx);
        }
    }

    clear() {
        this.particles = [];
        this.floatingTexts = [];
    }
}
