/**
 * HTML/CSS-based Stage Select Component
 * Replaces the canvas-based StageSelect with semantic HTML implementation
 */

export interface StageSelectItem {
    id: number;
    name: string;
    description: string;
}

export class HtmlStageSelect {
    private stages: StageSelectItem[] = [
        { id: 1, name: 'STAGE 1', description: 'Basic tutorial stage' },
        { id: 2, name: 'STAGE 2', description: 'Moving platforms' }
    ];

    private selectedStageIndex = 0;
    private stageElements: HTMLElement[] = [];
    private boundHandleKeyboard: (e: KeyboardEvent) => void;
    private isActive = false;

    constructor() {
        this.boundHandleKeyboard = this.handleKeyboard.bind(this);
    }

    /**
     * Initialize and show the stage select interface
     */
    public init(): void {
        this.showStageSelect();
    }

    /**
     * Show stage selection interface
     */
    private showStageSelect(): void {
        this.isActive = true;
        this.selectedStageIndex = 0;

        // Get stage item elements
        this.stageElements = Array.from(document.querySelectorAll('.stage-item')) as HTMLElement[];

        // Set up keyboard event listener
        document.addEventListener('keydown', this.boundHandleKeyboard);

        // Focus first stage by default
        if (this.stageElements.length > 0) {
            this.focusStage(0);
        }

        // Hide game UI elements
        this.hideGameElements();
    }

    /**
     * Hide stage selection interface
     */
    private hideStageSelect(): void {
        this.isActive = false;
        document.removeEventListener('keydown', this.boundHandleKeyboard);

        // Hide stage select element
        const stageSelectElement = document.getElementById('stageSelect');
        if (stageSelectElement) {
            stageSelectElement.style.display = 'none';
        }
    }

    /**
     * Handle keyboard input for stage navigation
     */
    private handleKeyboard(e: KeyboardEvent): void {
        if (!this.isActive) return;

        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                this.navigateUp();
                break;

            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                this.navigateDown();
                break;

            case ' ':
            case 'Enter':
                e.preventDefault();
                this.selectCurrentStage();
                break;
        }
    }

    /**
     * Navigate to previous stage
     */
    private navigateUp(): void {
        const newIndex = Math.max(0, this.selectedStageIndex - 1);
        if (newIndex !== this.selectedStageIndex) {
            this.focusStage(newIndex);
        }
    }

    /**
     * Navigate to next stage
     */
    private navigateDown(): void {
        const newIndex = Math.min(this.stages.length - 1, this.selectedStageIndex + 1);
        if (newIndex !== this.selectedStageIndex) {
            this.focusStage(newIndex);
        }
    }

    /**
     * Focus specific stage by index
     */
    private focusStage(index: number): void {
        if (index >= 0 && index < this.stageElements.length) {
            this.selectedStageIndex = index;
            this.stageElements[index].focus();
        }
    }

    /**
     * Select currently focused stage
     */
    private selectCurrentStage(): void {
        const selectedStage = this.stages[this.selectedStageIndex];
        if (selectedStage) {
            this.startStage(selectedStage.id);
        }
    }

    /**
     * Start selected stage and initialize game
     */
    private async startStage(_stageId: number): Promise<void> {
        // Updated for Phase 3: Use standard DOM click event instead of custom event
        // Simulate click on the current stage element to trigger main.ts event handler
        const currentStageElement = this.stageElements[this.selectedStageIndex];
        if (currentStageElement) {
            // Use the simple click() method to trigger the event
            // This works reliably in both browser and test environments
            currentStageElement.click();
        }

        this.hideStageSelect();
        this.showGameElements();
    }

    /**
     * Return to stage selection from game
     */
    public async returnToStageSelect(): Promise<void> {
        this.showStageSelect();
    }

    /**
     * Hide game UI elements during stage selection
     */
    private hideGameElements(): void {
        const gameUI = document.getElementById('gameUI') as HTMLElement;
        const info = document.querySelector('.info') as HTMLElement;
        const controls = document.querySelector('.controls') as HTMLElement;

        if (gameUI) gameUI.style.display = 'none';
        if (info) info.style.display = 'none';
        if (controls) controls.style.display = 'none';
    }

    /**
     * Show game UI elements when starting game
     */
    private showGameElements(): void {
        const gameUI = document.getElementById('gameUI') as HTMLElement;
        const info = document.querySelector('.info') as HTMLElement;
        const controls = document.querySelector('.controls') as HTMLElement;

        if (gameUI) gameUI.style.display = 'block';
        if (info) info.style.display = 'block';
        if (controls) controls.style.display = 'block';
    }
}
