/**
 * Interface for death mark rendering abstraction
 * Enables dependency inversion for testability
 */
export interface DeathMarkData {
    x: number;
    y: number;
    timestamp: number;
}

export interface IDeathMarkRenderer {
    /**
     * Render death marks at specified positions
     * @param deathMarks Array of death mark positions
     */
    renderDeathMarks(deathMarks: DeathMarkData[]): void;

    /**
     * Clear all currently rendered death marks
     */
    clearDeathMarks(): void;

    /**
     * Clean up renderer resources
     */
    cleanup(): Promise<void>;
}
