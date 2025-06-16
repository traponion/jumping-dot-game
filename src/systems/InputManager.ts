import { GameInputs } from 'game-inputs';

interface GameController {
    startGame(): void;
    init(): void;
    returnToStageSelect(): void;
    handleGameOverNavigation(direction: 'up' | 'down'): void;
    handleGameOverSelection(): void;
    getGameState(): { gameRunning: boolean; gameOver: boolean; finalScore: number };
}

export class InputManager {
    private inputs: GameInputs;
    private gameController: GameController;
    private gameRunning = false;
    private gameOver = false;
    private lastInputTime = 0;
    private inputCooldown = 300; // 300ms cooldown to prevent rapid inputs

    constructor(canvas: HTMLCanvasElement, gameController: GameController) {
        this.gameController = gameController;
        
        // Initialize game-inputs with the canvas
        this.inputs = new GameInputs(canvas, {
            preventDefaults: true,
            allowContextMenu: false,
            stopPropagation: false,
            disabled: false
        });

        this.setupBindings();
        this.setupEventHandlers();
    }

    private setupBindings(): void {
        // Movement controls (bind each key separately)
        this.inputs.bind('move-left', 'ArrowLeft');
        this.inputs.bind('move-left', 'KeyA');
        this.inputs.bind('move-right', 'ArrowRight');
        this.inputs.bind('move-right', 'KeyD');
        this.inputs.bind('jump', 'ArrowUp');
        this.inputs.bind('jump', 'KeyW');
        
        // Game control
        this.inputs.bind('start-game', 'Space');
        this.inputs.bind('restart', 'KeyR');
        
        // Menu navigation
        this.inputs.bind('menu-up', 'ArrowUp');
        this.inputs.bind('menu-down', 'ArrowDown');
        this.inputs.bind('menu-select', 'Enter');
        this.inputs.bind('menu-select', 'KeyR');
        this.inputs.bind('menu-select', 'Space');
    }

    private setupEventHandlers(): void {
        // Game start handling with debouncing
        this.inputs.down.on('start-game', () => {
            const now = Date.now();
            if (now - this.lastInputTime < this.inputCooldown) {
                return; // Ignore rapid inputs
            }
            this.lastInputTime = now;

            if (!this.gameRunning && !this.gameOver) {
                console.log('🚀 Starting game with Space');
                this.gameController.startGame();
            }
        });

        // Game restart handling with debouncing (legacy for direct restart)
        this.inputs.down.on('restart', () => {
            const now = Date.now();
            if (now - this.lastInputTime < this.inputCooldown) {
                return; // Ignore rapid inputs
            }
            this.lastInputTime = now;

            if (this.gameOver) {
                console.log('🔄 Restarting game with R');
                this.gameController.init();
            }
        });

        // Game over menu navigation
        this.inputs.down.on('menu-up', () => {
            if (this.gameController.getGameState().gameOver) {
                this.gameController.handleGameOverNavigation('up');
            }
        });

        this.inputs.down.on('menu-down', () => {
            if (this.gameController.getGameState().gameOver) {
                this.gameController.handleGameOverNavigation('down');
            }
        });

        this.inputs.down.on('menu-select', () => {
            if (this.gameController.getGameState().gameOver) {
                const now = Date.now();
                if (now - this.lastInputTime < this.inputCooldown) {
                    return; // Ignore rapid inputs
                }
                this.lastInputTime = now;
                
                this.gameController.handleGameOverSelection();
            }
        });
    }

    // Check if an action is currently pressed
    isPressed(action: string): boolean {
        return this.inputs.state[action] || false;
    }

    // Check if an action was just pressed this frame
    wasJustPressed(_action: string): boolean {
        // game-inputs doesn't expose presses directly, use event handlers instead
        return false; // Will be handled by event listeners
    }

    // Check if an action was just released this frame
    wasJustReleased(_action: string): boolean {
        // game-inputs doesn't expose releases directly, use event handlers instead
        return false; // Will be handled by event listeners
    }

    // Get movement input state (compatible with old KeyState)
    getMovementState() {
        return {
            ArrowLeft: this.isPressed('move-left'),
            ArrowRight: this.isPressed('move-right'),
            ArrowUp: this.isPressed('jump'),
            KeyA: this.isPressed('move-left'),
            KeyD: this.isPressed('move-right'),
            KeyW: this.isPressed('jump'),
            Space: this.isPressed('jump')
        };
    }

    setGameState(running: boolean, over: boolean): void {
        console.log(`🎮 Game state changed: running=${running}, over=${over}`);
        this.gameRunning = running;
        this.gameOver = over;
    }

    // Clear all input states (equivalent to old clearKeys)
    clearInputs(): void {
        console.log('🧹 Clearing all inputs');
        // game-inputs handles this internally, but we can reset our state
        this.inputs.tick(); // Process any pending events
        console.log('✅ Inputs cleared');
    }

    // Update the input system (call this in game loop)
    update(): void {
        this.inputs.tick();
    }

    cleanup(): void {
        // game-inputs will handle cleanup automatically
        console.log('🧽 InputManager cleanup');
    }

    // For testing purposes - simulate key events
    simulateKeyPress(action: string): void {
        // This would need to be implemented if testing is needed
        console.log(`🧪 Simulating key press: ${action}`);
    }

    simulateKeyRelease(action: string): void {
        // This would need to be implemented if testing is needed
        console.log(`🧪 Simulating key release: ${action}`);
    }
}