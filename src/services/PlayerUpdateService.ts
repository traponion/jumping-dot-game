/**
 * @fileoverview Player update logic service
 * @module services/PlayerUpdateService
 * @description Handles player movement, velocity, and physics-related updates.
 * Separated from state management to maintain single responsibility principle.
 */

import { GAME_CONFIG } from '../constants/GameConstants.js';
import type { Player, TrailPoint } from '../types/GameTypes.js';

/**
 * Store interface for player updates
 */
export interface PlayerStore {
    updatePlayer(player: Partial<Player>): void;
    getPlayer(): Player;
    markPlayerMoved(): void;
    addTrailPoint(point: { x: number; y: number }): void;
    updateTrail(trail: TrailPoint[]): void;
    getTrail(): TrailPoint[];
}


/**
 * Player update logic service
 * @description Handles player movement, velocity, and physics calculations.
 * Separated from Zustand store to maintain pure state management.
 */
export class PlayerUpdateService {
    private store: PlayerStore;

    /**
     * Creates new PlayerUpdateService instance
     * @param store - Store interface for player state updates
     */
    constructor(store: PlayerStore) {
        this.store = store;
    }

    /**
     * Update player velocity based on input direction
     * @param direction - Movement direction ('left' or 'right')
     * @param dtFactor - Delta time factor for frame-rate independence
     */
    public updatePlayerVelocity(direction: 'left' | 'right', dtFactor: number): void {
        const currentPlayer = this.store.getPlayer();
        const acceleration = GAME_CONFIG.player.acceleration;
        
        let newVx = currentPlayer.vx;
        if (direction === 'left') {
            newVx -= acceleration * dtFactor;
        } else {
            newVx += acceleration * dtFactor;
        }
        
        this.store.updatePlayer({ vx: newVx });
        this.store.markPlayerMoved();
    }

    /**
     * Clamp player speed to maximum limit
     * @param maxSpeed - Maximum allowed speed
     */
    public clampPlayerSpeed(maxSpeed: number): void {
        const currentPlayer = this.store.getPlayer();
        
        if (Math.abs(currentPlayer.vx) > maxSpeed) {
            const clampedVx = currentPlayer.vx >= 0 ? maxSpeed : -maxSpeed;
            this.store.updatePlayer({ vx: clampedVx });
        }
    }
    
        /**
         * Makes the player jump with specified force
         * @param jumpForce - Jump force value
         */
        public jumpPlayer(jumpForce: number): void {
            this.store.updatePlayer({
                vy: jumpForce,
                grounded: false
            });
        }
    
        /**
         * Adds a trail point for the player
         * @param point - Trail point to add
         */
        public addTrailPoint(point: { x: number; y: number }): void {
            this.store.addTrailPoint(point);
        }
    
        /**
         * Clears the player trail
         */
        public clearTrail(): void {
            this.store.updateTrail([]);
        }
    
        /**
         * Gets the current player state
         */
        public getPlayer(): Player {
            return this.store.getPlayer();
        }
    
        /**
         * Gets the current trail
         */
        public getTrail(): TrailPoint[] {
            return this.store.getTrail();
        }

    /**
     * Apply friction to player velocity
     * @param friction - Friction coefficient
     * @param dtFactor - Delta time factor
     */
    public applyFriction(friction: number, dtFactor: number): void {
        const currentPlayer = this.store.getPlayer();
        const newVx = currentPlayer.vx * Math.pow(friction, dtFactor);
        this.store.updatePlayer({ vx: newVx });
    }

    /**
     * Update player position based on velocity
     * @param dtFactor - Delta time factor
     */
    public updatePlayerPosition(dtFactor: number): void {
        const currentPlayer = this.store.getPlayer();
        const newX = currentPlayer.x + currentPlayer.vx * dtFactor;
        const newY = currentPlayer.y + currentPlayer.vy * dtFactor;
        
        this.store.updatePlayer({ x: newX, y: newY });
    }

    /**
     * Apply gravity to player
     * @param gravity - Gravity acceleration
     * @param dtFactor - Delta time factor
     */
    public applyGravity(gravity: number, dtFactor: number): void {
        const currentPlayer = this.store.getPlayer();
        const newVy = currentPlayer.vy + gravity * dtFactor;
        this.store.updatePlayer({ vy: newVy });
    }

    /**
     * Set player grounded state
     * @param grounded - Whether player is on ground
     */
    public setPlayerGrounded(grounded: boolean): void {
        this.store.updatePlayer({ grounded });
    }

    /**
     * Reset player to starting position
     * @param startX - Starting X position
     * @param startY - Starting Y position
     */
    public resetPlayerPosition(startX: number, startY: number): void {
        this.store.updatePlayer({
            x: startX,
            y: startY,
            vx: 0,
            vy: 0,
            grounded: false
        });
    }
}