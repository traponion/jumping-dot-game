/**
 * UI Renderer Interface
 * Responsible for rendering user interface elements
 */
export interface IUIRenderer {
    /**
     * Render start instruction overlay
     */
    renderStartInstruction(): void;

    /**
     * Render game over menu
     * @param options Menu options array
     * @param selectedIndex Currently selected option index
     * @param finalScore Final game score
     * @param deathCount Optional death count for this stage
     */
    renderGameOverMenu(
        options: string[],
        selectedIndex: number,
        finalScore: number,
        deathCount?: number
    ): void;

    /**
     * Render credits screen
     */
    renderCredits(): void;
}
