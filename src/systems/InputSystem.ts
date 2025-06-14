import type { KeyState } from '../types/GameTypes.js';

interface GameController {
    startGame(): void;
    init(): void;
}

export class InputSystem {
    private keys: KeyState = {};
    private gameController: GameController;
    private gameRunning = false;
    private gameOver = false;
    private handleKeyDown: (e: KeyboardEvent) => void;
    private handleKeyUp: (e: KeyboardEvent) => void;

    constructor(gameController: GameController) {
        this.gameController = gameController;

        this.handleKeyDown = this.onKeyDown.bind(this);
        this.handleKeyUp = this.onKeyUp.bind(this);

        this.setupEventListeners();
    }

    setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    cleanup(): void {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    private onKeyDown(e: KeyboardEvent): void {
        if (!this.gameOver) {
            this.keys[e.code] = true;
        }

        if (e.code === 'Space') {
            if (!this.gameRunning && !this.gameOver) {
                this.gameController.startGame();
            } else if (this.gameOver) {
                this.gameController.init();
            }
            e.preventDefault();
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
            e.preventDefault();
        }
    }

    private onKeyUp(e: KeyboardEvent): void {
        this.keys[e.code] = false;
    }

    getKeys(): KeyState {
        return { ...this.keys };
    }

    setGameState(running: boolean, over: boolean): void {
        this.gameRunning = running;
        this.gameOver = over;
    }

    clearKeys(): void {
        this.keys = {};
    }

    // For testing purposes
    simulateKeyDown(event: KeyboardEvent): void {
        this.onKeyDown(event);
    }

    simulateKeyUp(event: KeyboardEvent): void {
        this.onKeyUp(event);
    }

    testHandleKeyDown(event: KeyboardEvent): void {
        this.onKeyDown(event);
    }

    testHandleKeyUp(event: KeyboardEvent): void {
        this.onKeyUp(event);
    }
}
