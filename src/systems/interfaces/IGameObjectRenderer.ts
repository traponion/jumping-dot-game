import type { StageData } from '../../core/StageLoader';
import type { Player, TrailPoint } from '../../types/GameTypes';

/**
 * Game Object Renderer Interface
 * Responsible for rendering game entities (player, stage, trail, death marks)
 */
export interface IGameObjectRenderer {
    /**
     * Render the player character
     * @param player Player object to render
     */
    renderPlayer(player: Player): void;

    /**
     * Render the player's trail
     * @param trail Array of trail points to render
     * @param playerRadius Player radius for trail scaling
     */
    renderTrail(trail: TrailPoint[], playerRadius: number): void;

    /**
     * Render complete stage (platforms, goal, spikes, texts)
     * @param stage Stage data object
     */
    renderStage(stage: StageData): void;

    /**
     * Render death marks at previous death locations
     * @param deathMarks Array of death mark positions
     */
    renderDeathMarks(deathMarks: Array<{ x: number; y: number }>): void;
}
