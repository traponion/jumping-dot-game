/**
 * @fileoverview Input management system using game-inputs library
 * @module systems/InputManager
 * @description Application Layer - UI input handling and game controller coordination
 */

import { GameInputs } from 'game-inputs';
import type { GameState } from '../types/GameTypes.js';

/**
 * Interface defining the contract for game controllers that work with InputManager
 * @interface GameController
 * @description Defines the methods that a game controller must implement to work with InputManager
 */
export interface GameController {
    /** Start a new game */
    startGame(): void;
    /** Initialize or restart the game */
    init(): void;
    /** Return to stage selection screen */
    returnToStageSelect(): void;
    /** Handle menu navigation in game over state */
    handleGameOverNavigation(direction: 'up' | 'down'): void;
    /** Handle menu selection in game over state */
    handleGameOverSelection(): void;
    /** Handle stage select from game over screen */
    handleStageSelect(): void;
    /** Get current game state information */
    getGameState(): import('../stores/GameState.js').GameState;

    /** Get GameUI instance for DOM operations */
    getGameUI(): import('../core/GameUI.js').GameUI;
}

/**
 * InputManager - Handles keyboard input and coordinates with game controller
 * @class InputManager
 * @description Application Layer - Manages user input using game-inputs library and coordinates with game controller
 *
 * Responsibilities:
 * - Keyboard input binding and handling using game-inputs library
 * - Input debouncing and cooldown management
 * - Game state-aware input routing (game vs menu controls)
 * - Cleanup of input resources on destruction
 *
 * This class serves as an adapter between the game-inputs library and the game's control system,
 * providing a clean interface for input handling while managing timing and state transitions.
 */
export class InputManager {
    /** @private {GameInputs | null} The game-inputs instance for handling keyboard input */
    private inputs: GameInputs | null;
    /** @private {GameController | null} Reference to the game controller for handling game actions */
    private gameController: GameController | null;
    /** @private {number} Timestamp of the last processed input for debouncing */
    private lastInputTime = 0;
    /** @private {number} Cooldown period in milliseconds to prevent rapid inputs */
    private inputCooldown = 300; // 300ms cooldown to prevent rapid inputs

    /**
     * Creates a new InputManager instance
     * @param {HTMLCanvasElement} canvas - The canvas element to bind input events to
     * @param {GameController} gameController - The game controller to coordinate with
     * @description Initializes the input system with game-inputs library and sets up all key bindings
     */
    constructor(
        private gameState: GameState,
        container: HTMLElement,
        gameController: GameController
    ) {
        this.gameController = gameController;

        // Initialize game-inputs with the container element
        this.inputs = new GameInputs(container, {
            preventDefaults: true,
            allowContextMenu: false,
            stopPropagation: false,
            disabled: false
        });

        this.setupBindings();
        this.setupEventHandlers();
    }

    /**
     * Sets up keyboard input bindings using game-inputs library
     * @private
     * @returns {void}
     * @description Binds keyboard keys to named actions for movement, game control, and menu navigation
     */
    private setupBindings(): void {
        if (!this.inputs) return;

        // Movement controls (bind each key separately)
        this.inputs.bind('move-left', 'ArrowLeft');
        this.inputs.bind('move-left', 'KeyA');
        this.inputs.bind('move-right', 'ArrowRight');
        this.inputs.bind('move-right', 'KeyD');
        this.inputs.bind('jump', 'ArrowUp');
        this.inputs.bind('jump', 'KeyW');

        // Game control
        this.inputs.bind('restart', 'KeyR');

        // Menu navigation
        this.inputs.bind('menu-up', 'ArrowUp');
        this.inputs.bind('menu-down', 'ArrowDown');
        this.inputs.bind('menu-select', 'Enter');

        // Game over menu actions
        this.inputs.bind('restart-select', 'KeyR');
        this.inputs.bind('stage-select', 'Space');
    }

    /**
     * Sets up event handlers for input actions with debouncing and state management
     * @private
     * @returns {void}
     * @description Configures event listeners for game restart, menu navigation, and game start actions
     */
    private setupEventHandlers(): void {
        // Game start is now handled by menu-select to avoid conflicts

        // Game restart handling with debouncing (legacy for direct restart)
        this.inputs?.down.on('restart', () => {
            if (!this.gameController) return; // Guard against cleaned up instance

            const now = Date.now();
            if (now - this.lastInputTime < this.inputCooldown) {
                return; // Ignore rapid inputs
            }
            this.lastInputTime = now;

            // Only allow restart when game is actually over (NOT when game is cleared)
            if (this.gameState.gameOver && !this.gameState.gameCleared) {
                this.gameController.init();
            }
        });

        // Game over menu navigation
        this.inputs?.down.on('menu-up', () => {
            if (!this.gameController) return; // Guard against cleaned up instance
            // Only allow menu navigation when game is over (NOT when game is cleared)
            if (this.gameState.gameOver && !this.gameState.gameCleared) {
                this.gameController.handleGameOverNavigation('up');
            }
        });

        this.inputs?.down.on('menu-down', () => {
            if (!this.gameController) return; // Guard against cleaned up instance
            // Only allow menu navigation when game is over (NOT when game is cleared)
            if (this.gameState.gameOver && !this.gameState.gameCleared) {
                this.gameController.handleGameOverNavigation('down');
            }
        });

        this.inputs?.down.on('menu-select', () => {
            if (!this.gameController) return; // Guard against cleaned up instance

            const now = Date.now();
            if (now - this.lastInputTime < this.inputCooldown) {
                return; // Ignore rapid inputs
            }
            this.lastInputTime = now;

            // Only allow game over menu selection when game is over (NOT when game is cleared)
            if (this.gameState.gameOver && !this.gameState.gameCleared) {
                // Game over menu selection (Enter key only)
                this.gameController.handleGameOverSelection();
            }
        });

        // Restart selection (R key)
        this.inputs?.down.on('restart-select', () => {
            if (!this.gameController) return; // Guard against cleaned up instance

            const now = Date.now();
            if (now - this.lastInputTime < this.inputCooldown) {
                return; // Ignore rapid inputs
            }
            this.lastInputTime = now;

            // Only allow restart when game is over (NOT when game is cleared)
            if (this.gameState.gameOver && !this.gameState.gameCleared) {
                // Restart current stage
                this.gameController.handleGameOverSelection();
            }
        });

        // Stage select (Space key)
        this.inputs?.down.on('stage-select', () => {
            if (!this.gameController) return; // Guard against cleaned up instance

            const now = Date.now();
            if (now - this.lastInputTime < this.inputCooldown) {
                return; // Ignore rapid inputs
            }
            this.lastInputTime = now;

            if (this.gameState.gameOver) {
                // Both game over and clear screen: allow stage select
                this.gameController.handleStageSelect();
            } else if (!this.gameState.gameRunning) {
                // Game start (when not running and not over)
                this.gameController.startGame();
            }
        });
    }

    /**
     * Checks if a specific action is currently being pressed
     * @param {string} action - The action name to check (e.g., 'move-left', 'jump')
     * @returns {boolean} True if the action is currently pressed, false otherwise
     * @description Provides real-time input state checking for continuous actions like movement
     */
    isPressed(action: string): boolean {
        return this.inputs?.state[action] ?? false;
    }

    /**
     * Checks if an action was just pressed this frame (legacy method)
     * @param {string} _action - The action name (unused in current implementation)
     * @returns {boolean} Always returns false as game-inputs handles this via event listeners
     * @description Legacy method - use event handlers instead for single-press detection
     */
    wasJustPressed(_action: string): boolean {
        // game-inputs doesn't expose presses directly, use event handlers instead
        return false; // Will be handled by event listeners
    }

    /**
     * Checks if an action was just released this frame (legacy method)
     * @param {string} _action - The action name (unused in current implementation)
     * @returns {boolean} Always returns false as game-inputs handles this via event listeners
     * @description Legacy method - use event handlers instead for release detection
     */
    wasJustReleased(_action: string): boolean {
        // game-inputs doesn't expose releases directly, use event handlers instead
        return false; // Will be handled by event listeners
    }

    /**
     * Gets the current movement input state in a format compatible with legacy KeyState
     * @returns {Object} Object containing boolean values for each movement key
     * @description Provides backward compatibility with legacy input system by returning key states
     */
    getMovementState() {
        if (!this.inputs) return {};
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

    /**
     * Clears all input states and processes any pending events
     * @returns {void}
     * @description Equivalent to legacy clearKeys method - processes input tick to clear state
     */
    clearInputs(): void {
        // game-inputs handles this internally, but we can reset our state
        this.inputs?.tick(); // Process any pending events
    }

    /**
     * Updates the input system - should be called every frame in the game loop
     * @returns {void}
     * @description Processes input events and updates input state via game-inputs tick
     */
    update(): void {
        this.inputs?.tick();
    }

    /**
     * Cleans up input resources and prevents memory leaks
     * @returns {void}
     * @description Removes all event listeners, disables input processing, and clears references
     */
    cleanup(): void {
        // Clean up game-inputs instance
        if (this.inputs) {
            // game-inputs doesn't have a destroy method, so remove all listeners and disable
            this.inputs.down.removeAllListeners();
            this.inputs.up.removeAllListeners();
            this.inputs.disabled = true;
        }

        // Clear references to prevent zombie calls
        this.inputs = null;
        this.gameController = null;
    }

    /**
     * Simulates a key press for testing purposes
     * @param {string} action - The action name to simulate
     * @returns {void}
     * @description Development/testing method to simulate input events without actual keyboard interaction
     */
    simulateKeyPress(action: string): void {
        // This would need to be implemented if testing is needed
        console.log(`🧪 Simulating key press: ${action}`);
    }

    /**
     * Simulates a key release for testing purposes
     * @param {string} action - The action name to simulate
     * @returns {void}
     * @description Development/testing method to simulate key release events without actual keyboard interaction
     */
    simulateKeyRelease(action: string): void {
        // This would need to be implemented if testing is needed
        console.log(`🧪 Simulating key release: ${action}`);
    }
}
