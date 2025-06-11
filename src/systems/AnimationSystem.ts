import type { AnimationSystem as AnimationData, DeathMark, Player } from '../types/GameTypes.js';

export class AnimationSystem {
    private clearAnimation: AnimationData;
    private deathAnimation: AnimationData;
    private deathMarks: DeathMark[] = [];

    constructor() {
        this.clearAnimation = {
            active: false,
            startTime: null,
            duration: 3000,
            particles: []
        };

        this.deathAnimation = {
            active: false,
            startTime: null,
            duration: 2000,
            particles: []
        };
    }

    startClearAnimation(player: Player): void {
        this.clearAnimation.active = true;
        this.clearAnimation.startTime = performance.now();
        this.clearAnimation.particles = [];

        for (let i = 0; i < 20; i++) {
            this.clearAnimation.particles.push({
                x: player.x + (Math.random() - 0.5) * 100,
                y: player.y + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }

    updateClearAnimation(): void {
        if (!this.clearAnimation.active) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.clearAnimation.startTime!;

        for (let i = this.clearAnimation.particles.length - 1; i >= 0; i--) {
            const particle = this.clearAnimation.particles[i];

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= particle.decay;

            if (particle.life <= 0) {
                this.clearAnimation.particles.splice(i, 1);
            }
        }

        if (elapsed > this.clearAnimation.duration) {
            this.clearAnimation.active = false;
        }
    }

    startDeathAnimation(player: Player): void {
        this.deathAnimation.active = true;
        this.deathAnimation.startTime = performance.now();
        this.deathAnimation.particles = [];

        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = 3 + Math.random() * 4;

            this.deathAnimation.particles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                size: 2 + Math.random() * 2
            });
        }
    }

    updateDeathAnimation(): void {
        if (!this.deathAnimation.active) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.deathAnimation.startTime!;

        for (let i = this.deathAnimation.particles.length - 1; i >= 0; i--) {
            const particle = this.deathAnimation.particles[i];

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= particle.decay;

            if (particle.life <= 0) {
                this.deathAnimation.particles.splice(i, 1);
            }
        }

        if (elapsed > this.deathAnimation.duration) {
            this.deathAnimation.active = false;
        }
    }

    addDeathMark(x: number, y: number): void {
        this.deathMarks.push({
            x,
            y,
            timestamp: performance.now()
        });
    }

    getClearAnimation(): AnimationData {
        return this.clearAnimation;
    }

    getDeathAnimation(): AnimationData {
        return this.deathAnimation;
    }

    getDeathMarks(): DeathMark[] {
        return [...this.deathMarks];
    }

    reset(): void {
        this.clearAnimation.active = false;
        this.clearAnimation.startTime = null;
        this.clearAnimation.particles = [];

        this.deathAnimation.active = false;
        this.deathAnimation.startTime = null;
        this.deathAnimation.particles = [];
    }

    isAnyAnimationActive(): boolean {
        return this.clearAnimation.active || this.deathAnimation.active;
    }
}
