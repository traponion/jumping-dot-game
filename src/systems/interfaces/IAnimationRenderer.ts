import type { Particle } from '../../types/GameTypes';

/**
 * Animation Renderer Interface
 * Responsible for rendering various game animations
 */
export interface IAnimationRenderer {
    /**
     * Render death animation particles
     * @param particles Array of particle objects
     */
    renderDeathAnimation(particles: Particle[]): void;

    /**
     * Render soul animation flying to death counter
     * @param particles Array of soul particle objects
     */
    renderSoulAnimation(particles: Particle[]): void;

    /**
     * Render stage clear animation
     * @param particles Array of particle objects
     * @param progress Animation progress (0-1)
     * @param centerX Center X coordinate
     * @param centerY Center Y coordinate
     */
    renderClearAnimation(
        particles: Particle[],
        progress: number,
        centerX: number,
        centerY: number
    ): void;
}
