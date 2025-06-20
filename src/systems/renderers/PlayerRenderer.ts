/**
 * @fileoverview Player rendering system (player dot, velocity indicators, trails)
 * @module systems/renderers/PlayerRenderer
 * @description Specialized renderer for player-related visual elements.
 * Separated from FabricRenderSystem to maintain single responsibility principle.
 */

import * as fabric from 'fabric';
import type { Player } from '../../types/GameTypes.js';

/**
 * Configuration for player rendering
 */
interface PlayerRenderConfig {
    trailLength: number;
    velocityIndicatorLength: number;
    showVelocityIndicator: boolean;
    showTrail: boolean;
}

/**
 * Renderer for player elements (dot, velocity, trail)
 * @description Handles rendering of all player-related visual elements.
 */
export class PlayerRenderer {
    private canvas: fabric.Canvas;
    private config: PlayerRenderConfig;
    private playerShape: fabric.Circle | null = null;
    private velocityIndicator: fabric.Line | null = null;
    private trailShapes: fabric.Circle[] = [];

    /**
     * Creates new PlayerRenderer instance
     * @param canvas - Fabric.js canvas instance
     * @param config - Optional rendering configuration
     */
    constructor(canvas: fabric.Canvas, config?: Partial<PlayerRenderConfig>) {
        this.canvas = canvas;
        this.config = {
            trailLength: 10,
            velocityIndicatorLength: 50,
            showVelocityIndicator: true,
            showTrail: true,
            ...config
        };
    }

    /**
     * Render player at current position
     * @param player - Player data to render
     */
    public renderPlayer(player: Player): void {
        this.renderPlayerDot(player);
        
        if (this.config.showVelocityIndicator) {
            this.renderVelocityIndicator(player);
        }
        
        if (this.config.showTrail) {
            this.updateTrail(player);
        }
    }

    /**
     * Render main player dot
     * @param player - Player data
     */
    private renderPlayerDot(player: Player): void {
        if (this.playerShape) {
            // Update existing player position
            this.playerShape.set({
                left: player.x,
                top: player.y
            });
        } else {
            // Create new player shape
            this.playerShape = new fabric.Circle({
                left: player.x,
                top: player.y,
                radius: player.radius,
                fill: '#3182ce',
                stroke: '#2c5aa0',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false
            });
            this.canvas.add(this.playerShape);
        }
    }

    /**
     * Render velocity direction indicator
     * @param player - Player data with velocity
     */
    private renderVelocityIndicator(player: Player): void {
        // Remove existing indicator
        if (this.velocityIndicator) {
            this.canvas.remove(this.velocityIndicator);
            this.velocityIndicator = null;
        }

        // Only show if player has significant velocity
        const velocityMagnitude = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        if (velocityMagnitude < 0.1) return;

        // Calculate indicator end position
        const normalizedVelX = player.vx / velocityMagnitude;
        const normalizedVelY = player.vy / velocityMagnitude;
        const indicatorLength = Math.min(this.config.velocityIndicatorLength, velocityMagnitude * 10);

        const endX = player.x + normalizedVelX * indicatorLength;
        const endY = player.y + normalizedVelY * indicatorLength;

        this.velocityIndicator = new fabric.Line([player.x, player.y, endX, endY], {
            stroke: '#e53e3e',
            strokeWidth: 3,
            selectable: false,
            evented: false
        });

        this.canvas.add(this.velocityIndicator);
    }

    /**
     * Update player movement trail
     * @param player - Current player position
     */
    private updateTrail(player: Player): void {
        // Add new trail point
        const trailDot = new fabric.Circle({
            left: player.x,
            top: player.y,
            radius: player.radius * 0.3,
            fill: '#3182ce',
            opacity: 0.3,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
        });

        this.trailShapes.push(trailDot);
        this.canvas.add(trailDot);

        // Remove old trail points
        while (this.trailShapes.length > this.config.trailLength) {
            const oldTrail = this.trailShapes.shift();
            if (oldTrail) {
                this.canvas.remove(oldTrail);
            }
        }

        // Update trail opacity (fade effect)
        this.trailShapes.forEach((trail, index) => {
            const opacity = (index / this.trailShapes.length) * 0.3;
            trail.set({ opacity });
        });
    }

    /**
     * Clear all player visual elements
     */
    public clearPlayer(): void {
        if (this.playerShape) {
            this.canvas.remove(this.playerShape);
            this.playerShape = null;
        }

        if (this.velocityIndicator) {
            this.canvas.remove(this.velocityIndicator);
            this.velocityIndicator = null;
        }

        this.clearTrail();
    }

    /**
     * Clear player trail
     */
    public clearTrail(): void {
        this.trailShapes.forEach(trail => this.canvas.remove(trail));
        this.trailShapes = [];
    }

    /**
     * Update rendering configuration
     * @param config - New configuration options
     */
    public updateConfig(config: Partial<PlayerRenderConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current rendering configuration
     */
    public getConfig(): PlayerRenderConfig {
        return { ...this.config };
    }

    /**
     * Cleanup renderer resources
     */
    public dispose(): void {
        this.clearPlayer();
    }
}