import type { IEditorController } from '../controllers/EditorController.js';
import type { StageData } from '../core/StageLoader.js';
import type { FabricObjectWithData } from '../types/EditorTypes.js';
import { DebugHelper } from '../utils/EditorUtils.js';

/**
 * エディターのView層実装
 * - UI要素の管理と更新
 * - ユーザーインタラクションの処理
 * - 表示状態の制御
 */
export class EditorView {
    private controller!: IEditorController;
    public canvas: HTMLCanvasElement;
    private uiManager!: any; // Will be injected by EditorController
    private isInitialized: boolean = false;

    // Throttled event handlers
    private throttledMouseMove: (event: MouseEvent) => void;
    private debouncedStageInfoUpdate: () => void;

    /**
     * Create EditorView instance
     * @param canvas - Canvas element for rendering
     */
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        
        // Initialize throttled handlers
        this.throttledMouseMove = this.throttle((event: MouseEvent) => {
            this.handleMouseMove(event);
        }, 16);

        this.debouncedStageInfoUpdate = this.debounce(() => {
            this.updateStageInfoFromInputs();
        }, 300);
    }

    /**
     * Set controller reference
     */
    public setController(controller: IEditorController): void {
        this.controller = controller;
    }

    /**
     * Set UI manager reference
     */
    public setUIManager(uiManager: any): void {
        this.uiManager = uiManager;
    }

    /**
     * Initialize the view
     */
    public initialize(): void {
        if (this.isInitialized) return;
        
        // UI Manager handles all DOM operations now
        this.setupCanvasEvents();
        this.isInitialized = true;
        
        DebugHelper.log('EditorView initialized', {
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            }
        });
    }

    /**
     * Setup canvas-specific event listeners
     */
    private setupCanvasEvents(): void {
        this.canvas.addEventListener('mousemove', this.throttledMouseMove);
    }

    /**
     * Update tool selection UI (delegated to UIManager)
     */
    public updateToolSelection(selectedTool: string): void {
        this.uiManager?.updateToolSelection(selectedTool);
    }

    /**
     * Update current tool display (delegated to UIManager)
     */
    public updateCurrentTool(tool: string): void {
        this.uiManager?.updateCurrentTool(tool);
    }

    /**
     * Update object count display (delegated to UIManager)
     */
    public updateObjectCount(count: number): void {
        this.uiManager?.updateObjectCount(count);
    }

    /**
     * Update mouse coordinates display (delegated to UIManager)
     */
    public updateMouseCoordinates(x: number, y: number): void {
        this.uiManager?.updateMouseCoordinates(x, y);
    }

    /**
     * Update stage information display
     */
    public updateStageInfo(stageData: StageData): void {
        // Simple stage info update - complex logic moved to UIManager
        DebugHelper.log('Stage info updated', {
            stageName: stageData.name,
            stageId: stageData.id
        });
    }

    /**
     * Show object properties panel
     */
    public showObjectProperties(object: FabricObjectWithData | null): void {
        if (!this.isInitialized) return;

        // Hide all property panels first
        this.hideAllPropertyPanels();

        if (!object) {
            this.showPropertyPanel('noSelection');
            return;
        }

        // Show appropriate property panel based on object type
        const objectType = (object as any).data?.type;
        switch (objectType) {
            case 'platform':
                this.showPropertyPanel('platformProperties');
                this.loadPlatformProperties(object);
                break;
            case 'spike':
                this.showPropertyPanel('spikeProperties');
                this.loadSpikeProperties(object);
                break;
            case 'goal':
                this.showPropertyPanel('goalProperties');
                this.loadGoalProperties(object);
                break;
            case 'text':
                this.showPropertyPanel('textProperties');
                this.loadTextProperties(object);
                break;
            default:
                this.showPropertyPanel('noSelection');
        }
    }

    /**
     * Enable/disable action buttons (delegated to UIManager)
     */
    public enableActionButtons(enabled: boolean): void {
        this.uiManager?.enableActionButtons(enabled);
    }

    /**
     * Show success message
     */
    public showSuccessMessage(message: string): void {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    public showErrorMessage(message: string): void {
        this.showMessage(message, 'error');
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.canvas.removeEventListener('mousemove', this.throttledMouseMove);
        this.isInitialized = false;
    }

    // Private helper methods (simplified versions)

    /**
     * Hide all property panels
     */
    private hideAllPropertyPanels(): void {
        const panels = ['noSelection', 'platformProperties', 'spikeProperties', 'goalProperties', 'textProperties'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            }
        });
    }

    /**
     * Show specific property panel
     */
    private showPropertyPanel(panelId: string): void {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'block';
        }
    }

    /**
     * Load platform object properties
     */
    private loadPlatformProperties(object: FabricObjectWithData): void {
        // Simplified property loading
        DebugHelper.log('Platform properties loaded', {
            objectType: 'platform',
            position: { x: object.left, y: object.top }
        });
    }

    /**
     * Load spike object properties
     */
    private loadSpikeProperties(object: FabricObjectWithData): void {
        DebugHelper.log('Spike properties loaded', {
            objectType: 'spike'
        });
    }

    /**
     * Load goal object properties
     */
    private loadGoalProperties(object: FabricObjectWithData): void {
        DebugHelper.log('Goal properties loaded', {
            objectType: 'goal'
        });
    }

    /**
     * Load text object properties
     */
    private loadTextProperties(object: FabricObjectWithData): void {
        DebugHelper.log('Text properties loaded', {
            objectType: 'text'
        });
    }

    /**
     * Handle mouse move events
     */
    private handleMouseMove(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.round(event.clientX - rect.left);
        const y = Math.round(event.clientY - rect.top);
        
        this.updateMouseCoordinates(x, y);
    }

    /**
     * Update stage info from input fields (simplified)
     */
    private updateStageInfoFromInputs(): void {
        // This is now handled by UIManager
        DebugHelper.log('Stage info update requested');
    }

    /**
     * Show message (simplified)
     */
    private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Basic message display
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            const messageElement = document.createElement('div');
            messageElement.className = `message message-${type}`;
            messageElement.textContent = message;
            messageContainer.appendChild(messageElement);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (messageElement.parentElement) {
                    messageElement.parentElement.removeChild(messageElement);
                }
            }, 3000);
        }
    }

    /**
     * Show welcome message
     */
    public showWelcomeMessage(): void {
        this.showMessage('Welcome to Stage Editor!', 'info');
    }

    // Utility functions

    /**
     * Throttle function execution
     */
    private throttle(func: Function, limit: number): (...args: any[]) => void {
        let inThrottle: boolean;
        return function(this: any, ...args: any[]) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Debounce function execution
     */
    private debounce(func: Function, wait: number): (...args: any[]) => void {
        let timeout: NodeJS.Timeout;
        return function(this: any, ...args: any[]) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

