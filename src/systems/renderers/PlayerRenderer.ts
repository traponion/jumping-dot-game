import * as fabric from 'fabric';

import type { Player } from '../../types/GameTypes';

/**
 * PlayerRenderer - Handles player rendering
 * Extracted from FabricRenderSystem for single responsibility
 */
export class PlayerRenderer {
    private playerShape: fabric.Circle | null = null;

    constructor(private canvas: fabric.Canvas) {}

    /**
     * Render player as white circle
     */
    renderPlayer(player: Player): void {
        if (this.playerShape) {
            // Update existing player shape
            this.playerShape.set({
                left: player.x - player.radius,
                top: player.y - player.radius
            });
        } else {
            // Create new player shape
            this.playerShape = new fabric.Circle({
                left: player.x - player.radius,
                top: player.y - player.radius,
                radius: player.radius,
                fill: 'white',
                selectable: false,
                evented: false
            });
            this.canvas.add(this.playerShape);
        }
    }

    /**
     * Clean up all player-related shapes
     */
    cleanup(): void {
        if (this.playerShape) {
            this.canvas.remove(this.playerShape);
            this.playerShape = null;
        }
    }
}
